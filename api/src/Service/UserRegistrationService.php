<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Exception\EmailAlreadyExistsException;
use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserRegistrationService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function register(RegisterRequest $request): User
    {
        $normalizedEmail = strtolower(trim($request->email));

        if ($this->userRepository->findOneByEmail($normalizedEmail) !== null) {
            throw new EmailAlreadyExistsException($normalizedEmail);
        }

        $user = new User();
        $user->setEmail($normalizedEmail);
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $request->password)
        );

        $this->userRepository->save($user, flush: true);

        return $user;
    }
}
