<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Upload;

use App\Exception\FileTypeRejectedException;
use App\Service\Upload\FileValidator;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Mime\MimeTypes;

final class FileValidatorTest extends TestCase
{
    private const array BLACKLIST = [
        'exe', 'bat', 'cmd', 'com', 'scr', 'msi',
        'ps1', 'vbs', 'vbe', 'wsf', 'wsh', 'jar',
    ];

    /** @var list<string> */
    private array $tempFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->tempFiles = [];
    }

    public function testValidateReturnsDetectedMimeForLegitTextFile(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('readme.txt', 'Hello world');

        $mime = $validator->validate($file);

        self::assertSame('text/plain', $mime);
    }

    public function testValidateRejectsBlacklistedExtension(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('malware.exe', 'arbitrary content');

        try {
            $validator->validate($file);
            self::fail('Expected FileTypeRejectedException to be thrown.');
        } catch (FileTypeRejectedException $e) {
            self::assertSame(FileTypeRejectedException::REASON_BLACKLISTED_EXTENSION, $e->reason);
        }
    }

    public function testValidateRejectsBlacklistedExtensionCaseInsensitively(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('MALWARE.EXE', 'arbitrary content');

        $this->expectException(FileTypeRejectedException::class);
        $validator->validate($file);
    }

    public function testValidateRejectsRenamedWindowsExecutable(): void
    {
        $validator = $this->createValidator();
        $exeHeader = "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00"
            . str_repeat("\x00", 64)
            . "PE\x00\x00";
        $file = $this->uploadedFile('innocent.txt', $exeHeader);

        try {
            $validator->validate($file);
            self::fail('Expected FileTypeRejectedException to be thrown.');
        } catch (FileTypeRejectedException $e) {
            self::assertSame(FileTypeRejectedException::REASON_SUSPICIOUS_MAGIC_BYTES, $e->reason);
        }
    }

    public function testValidateAcceptsFileWithoutExtension(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('myfile', 'plain text');

        $mime = $validator->validate($file);

        self::assertSame('text/plain', $mime);
    }

    public function testValidateAcceptsZoneGriseExtension(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('build.sh', "#!/bin/bash\necho hello");

        $mime = $validator->validate($file);

        self::assertNotEmpty($mime);
    }

    public function testValidateAcceptsEmptyFile(): void
    {
        $validator = $this->createValidator();
        $file = $this->uploadedFile('empty.txt', '');

        $mime = $validator->validate($file);

        self::assertNotEmpty($mime);
    }

    private function createValidator(): FileValidator
    {
        return new FileValidator(self::BLACKLIST, new MimeTypes());
    }

    private function uploadedFile(string $clientName, string $bytes): UploadedFile
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'datashare-validator-');
        if ($tempPath === false) {
            self::fail('Cannot create temp file for test.');
        }
        file_put_contents($tempPath, $bytes);
        $this->tempFiles[] = $tempPath;

        return new UploadedFile(
            path: $tempPath,
            originalName: $clientName,
            mimeType: null,
            error: UPLOAD_ERR_OK,
            test: true,
        );
    }
}
