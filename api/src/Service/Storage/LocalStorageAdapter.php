<?php

declare(strict_types=1);

namespace App\Service\Storage;

use RuntimeException;

class LocalStorageAdapter implements StorageInterface
{
    public function __construct(
        private readonly string $rootPath,
    ) {
    }

    public function store($source, string $key): void
    {
        $absolutePath = $this->rootPath . '/' . $key;
        $absoluteDir = dirname($absolutePath);

        if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0755, true) && !is_dir($absoluteDir)) {
            throw new RuntimeException(sprintf('Cannot create storage directory "%s".', $absoluteDir));
        }

        $dest = fopen($absolutePath, 'wb');
        if ($dest === false) {
            throw new RuntimeException(sprintf('Cannot open destination "%s" for writing.', $absolutePath));
        }

        try {
            if (stream_copy_to_stream($source, $dest) === false) {
                throw new RuntimeException(sprintf('Failed to stream contents into "%s".', $absolutePath));
            }
        } finally {
            fclose($dest);
        }
    }

    public function openReadStream(string $key)
    {
        $absolutePath = $this->rootPath . '/' . $key;

        if (!is_file($absolutePath)) {
            throw new StorageObjectNotFoundException(sprintf('No stored object for key "%s".', $key));
        }

        $handle = fopen($absolutePath, 'rb');
        if ($handle === false) {
            throw new RuntimeException(sprintf('Cannot open "%s" for reading.', $absolutePath));
        }

        return $handle;
    }

    public function delete(string $key): void
    {
        $absolutePath = $this->rootPath . '/' . $key;

        if (!is_file($absolutePath)) {
            return; // idempotent
        }

        if (!@unlink($absolutePath)) {
            throw new RuntimeException(sprintf('Cannot delete "%s".', $absolutePath));
        }
    }
}
