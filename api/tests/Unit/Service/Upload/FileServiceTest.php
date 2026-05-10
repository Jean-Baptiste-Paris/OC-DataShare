<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Upload;

use App\Entity\File;
use App\Entity\User;
use App\Exception\FileTypeRejectedException;
use App\Repository\FileRepository;
use App\Service\Storage\StorageInterface;
use App\Service\Upload\FileService;
use App\Service\Upload\FileValidator;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class FileServiceTest extends TestCase
{
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

    public function testUploadDelegatesToCollaboratorsAndReturnsPersistedFile(): void
    {
        $validator = $this->createMock(FileValidator::class);
        $storage = $this->createMock(StorageInterface::class);
        $repository = $this->createMock(FileRepository::class);

        $user = new User();
        $uploadedFile = $this->makeUploadedFile('cv.pdf', 'pdf-bytes-here');

        $validator->expects($this->once())
            ->method('validate')
            ->with($uploadedFile)
            ->willReturn('application/pdf');

        $storage->expects($this->once())
            ->method('store')
            ->with(
                $this->callback(static fn ($r): bool => is_resource($r)),
                $this->callback(static fn (string $key): bool => 1 === preg_match('#^\d{4}/\d{2}/[0-9a-f-]{36}\.bin$#', $key)),
            );

        $repository->expects($this->once())
            ->method('save')
            ->with(
                $this->callback(function (File $file) use ($user): bool {
                    return $file->getUser() === $user
                        && $file->getName() === 'cv.pdf'
                        && $file->getMimeType() === 'application/pdf'
                        && $file->getSizeBytes() === strlen('pdf-bytes-here')
                        && str_ends_with($file->getStorageKey(), '.bin');
                }),
                true,
            );

        $service = new FileService($validator, $storage, $repository);
        $result = $service->upload($uploadedFile, $user);

        self::assertSame('application/pdf', $result->getMimeType());
        self::assertSame('cv.pdf', $result->getName());
        self::assertSame($user, $result->getUser());
    }

    public function testUploadStopsBeforeStorageWhenValidatorRejects(): void
    {
        $validator = $this->createStub(FileValidator::class);
        $storage = $this->createMock(StorageInterface::class);
        $repository = $this->createMock(FileRepository::class);

        $validator->method('validate')->willThrowException(
            new FileTypeRejectedException(
                FileTypeRejectedException::REASON_BLACKLISTED_EXTENSION,
                'Extension ".exe" is blacklisted.',
            ),
        );
        $storage->expects($this->never())->method('store');
        $repository->expects($this->never())->method('save');

        $service = new FileService($validator, $storage, $repository);

        $this->expectException(FileTypeRejectedException::class);
        $service->upload($this->makeUploadedFile('malware.exe', 'data'), new User());
    }

    public function testUploadDoesNotPersistEntityWhenStorageFails(): void
    {
        $validator = $this->createStub(FileValidator::class);
        $validator->method('validate')->willReturn('application/pdf');

        $storage = $this->createStub(StorageInterface::class);
        $storage->method('store')->willThrowException(new RuntimeException('disk full'));

        $repository = $this->createMock(FileRepository::class);
        $repository->expects($this->never())->method('save');

        $service = new FileService($validator, $storage, $repository);

        $this->expectException(RuntimeException::class);
        $service->upload($this->makeUploadedFile('cv.pdf', 'data'), new User());
    }

    private function makeUploadedFile(string $clientName, string $bytes): UploadedFile
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'datashare-fileservice-');
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
