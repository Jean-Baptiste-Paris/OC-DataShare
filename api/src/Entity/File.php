<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\FileRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: FileRepository::class)]
#[ORM\Table(name: 'files')]
#[ORM\Index(columns: ['user_id', 'created_at'], name: 'idx_files_user_created_at')]
#[ORM\HasLifecycleCallbacks]
class File
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid')]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $user;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'bigint')]
    private string $sizeBytes;

    #[ORM\Column(type: 'string', length: 255)]
    private string $mimeType;

    #[ORM\Column(type: 'string', length: 500)]
    private string $storageKey;

    #[ORM\Column(type: 'datetimetz_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetimetz_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(type: 'datetimetz_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    public function __construct(
        User $user,
        string $name,
        int $sizeBytes,
        string $mimeType,
        string $storageKey,
    ) {
        $this->id = Uuid::v7();
        $this->user = $user;
        $this->name = $name;
        $this->sizeBytes = (string) $sizeBytes;
        $this->mimeType = $mimeType;
        $this->storageKey = $storageKey;
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    #[ORM\PreUpdate]
    public function refreshUpdatedAt(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSizeBytes(): int
    {
        return (int) $this->sizeBytes;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getStorageKey(): string
    {
        return $this->storageKey;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function isAvailable(): bool
    {
        return $this->deletedAt === null;
    }

    public function markDeleted(): void
    {
        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = $this->deletedAt;
    }
}
