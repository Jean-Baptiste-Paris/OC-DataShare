<?php

declare(strict_types=1);

namespace App\Service\Upload;

use App\Entity\File;
use App\Entity\User;
use App\Repository\FileRepository;
use App\Service\Storage\StorageInterface;
use DateTimeImmutable;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

class FileService
{
    public function __construct(
        private readonly FileValidator $validator,
        private readonly StorageInterface $storage,
        private readonly FileRepository $repository,
    ) {
    }

    public function upload(UploadedFile $uploadedFile, User $user): File
    {
        $detectedMime = $this->validator->validate($uploadedFile);

        $storageKey = sprintf(
            '%s/%s.bin',
            (new DateTimeImmutable())->format('Y/m'),
            Uuid::v7()->toRfc4122(),
        );

        $source = fopen($uploadedFile->getRealPath(), 'rb');
        if ($source === false) {
            throw new RuntimeException('Cannot open uploaded file for reading.');
        }

        try {
            $this->storage->store($source, $storageKey);
        } finally {
            fclose($source);
        }

        $size = $uploadedFile->getSize();
        if ($size === false) {
            throw new RuntimeException('Cannot determine uploaded file size.');
        }

        $file = new File(
            user: $user,
            name: $uploadedFile->getClientOriginalName(),
            sizeBytes: $size,
            mimeType: $detectedMime,
            storageKey: $storageKey,
        );

        $this->repository->save($file, flush: true);

        return $file;
    }
}
