<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\File;
use DateTimeInterface;

final readonly class SharedFile
{
    public function __construct(
        public string $name,
        public int $sizeBytes,
        public string $mimeType,
        public string $createdAt,
    ) {
    }

    public static function fromFile(File $file): self
    {
        return new self(
            name: $file->getName(),
            sizeBytes: $file->getSizeBytes(),
            mimeType: $file->getMimeType(),
            createdAt: $file->getCreatedAt()->format(DateTimeInterface::ATOM),
        );
    }
}
