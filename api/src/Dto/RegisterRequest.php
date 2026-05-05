<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RegisterRequest
{
    public function __construct(
        #[Assert\NotBlank(message: 'L\'email est obligatoire.')]
        #[Assert\Email(message: 'Format d\'email invalide.')]
        #[Assert\Length(max: 254, maxMessage: 'L\'email ne peut pas dépasser {{ limit }} caractères.')]
        public string $email,

        #[Assert\NotBlank(message: 'Le mot de passe est obligatoire.')]
        #[Assert\Length(min: 8, minMessage: 'Le mot de passe doit faire au moins {{ limit }} caractères.')]
        public string $password,
    ) {
    }
}
