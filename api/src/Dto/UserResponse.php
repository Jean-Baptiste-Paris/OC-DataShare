<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\User;
use DateTimeInterface;

final readonly class UserResponse
{
    public function __construct(
        public string $id,
        public string $email,
        public string $createdAt,
    ) {
    }

    public static function fromUser(User $user): self
    {
        return new self(
            id: $user->getId()->toRfc4122(),
            email: $user->getEmail(),
            createdAt: $user->getCreatedAt()->format(DateTimeInterface::ATOM),
        );
    }
}
