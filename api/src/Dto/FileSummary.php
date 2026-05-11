<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\File;
use DateTimeInterface;

final readonly class FileSummary
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_DELETED = 'deleted';

    public function __construct(
        public string $id,
        public string $name,
        public int $sizeBytes,
        public string $mimeType,
        public string $createdAt,
        public string $status,
    ) {
    }

    public static function fromFile(File $file): self
    {
        return new self(
            id: $file->getId()->toRfc4122(),
            name: $file->getName(),
            sizeBytes: $file->getSizeBytes(),
            mimeType: $file->getMimeType(),
            createdAt: $file->getCreatedAt()->format(DateTimeInterface::ATOM),
            status: $file->isAvailable() ? self::STATUS_AVAILABLE : self::STATUS_DELETED,
        );
    }
}
