<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Storage;

use App\Service\Storage\LocalStorageAdapter;
use App\Service\Storage\StorageObjectNotFoundException;
use PHPUnit\Framework\TestCase;

final class LocalStorageAdapterTest extends TestCase
{
    private string $tmpDir;

    protected function setUp(): void
    {
        $this->tmpDir = sys_get_temp_dir() . '/datashare-storage-' . uniqid('', true);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->tmpDir)) {
            $this->removeDirectory($this->tmpDir);
        }
    }

    public function testStorePersistsBytesAtTheGivenKey(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);
        $payload = random_bytes(1024 * 256);
        $key = '2026/05/test-key.bin';

        $source = $this->streamFrom($payload);
        $adapter->store($source, $key);
        fclose($source);

        self::assertFileExists($this->tmpDir . '/' . $key);
        self::assertSame($payload, file_get_contents($this->tmpDir . '/' . $key));
    }

    public function testStoreCreatesIntermediateDirectories(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);

        $source = $this->streamFrom('hello');
        $adapter->store($source, 'a/b/c/file.bin');
        fclose($source);

        self::assertDirectoryExists($this->tmpDir . '/a/b/c');
        self::assertFileExists($this->tmpDir . '/a/b/c/file.bin');
    }

    public function testStorePreservesBytesAcrossLargerStream(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);

        $source = fopen('php://temp', 'w+b');
        $sha = hash_init('sha256');
        for ($i = 0; $i < 64; ++$i) {
            $chunk = random_bytes(64 * 1024);
            hash_update($sha, $chunk);
            fwrite($source, $chunk);
        }
        $expectedHash = hash_final($sha);
        rewind($source);

        $adapter->store($source, 'large/file.bin');
        fclose($source);

        self::assertSame($expectedHash, hash_file('sha256', $this->tmpDir . '/large/file.bin'));
    }

    public function testOpenReadStreamReturnsBytesPreviouslyStored(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);
        $payload = "binary\x00content\x01here";
        $key = 'reads/file.bin';

        $source = $this->streamFrom($payload);
        $adapter->store($source, $key);
        fclose($source);

        $handle = $adapter->openReadStream($key);
        self::assertIsResource($handle);
        $read = stream_get_contents($handle);
        fclose($handle);

        self::assertSame($payload, $read);
    }

    public function testOpenReadStreamThrowsWhenKeyDoesNotExist(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);

        $this->expectException(StorageObjectNotFoundException::class);
        $adapter->openReadStream('does/not/exist.bin');
    }

    public function testDeleteRemovesPreviouslyStoredObject(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);
        $source = $this->streamFrom('to-be-removed');
        $adapter->store($source, 'gone/file.bin');
        fclose($source);
        self::assertFileExists($this->tmpDir . '/gone/file.bin');

        $adapter->delete('gone/file.bin');

        self::assertFileDoesNotExist($this->tmpDir . '/gone/file.bin');
    }

    public function testDeleteIsIdempotentWhenKeyDoesNotExist(): void
    {
        $adapter = new LocalStorageAdapter($this->tmpDir);

        $adapter->delete('never/existed.bin');

        // No exception means OK — idempotent silent success.
        self::assertTrue(true);
    }

    /** @return resource */
    private function streamFrom(string $bytes)
    {
        $stream = fopen('php://memory', 'w+b');
        fwrite($stream, $bytes);
        rewind($stream);

        return $stream;
    }

    private function removeDirectory(string $dir): void
    {
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
