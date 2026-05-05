<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\RegisterRequest;
use App\Dto\UserResponse;
use App\Exception\EmailAlreadyExistsException;
use App\Service\UserRegistrationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth', name: 'auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly UserRegistrationService $userRegistration,
    ) {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(#[MapRequestPayload] RegisterRequest $request): JsonResponse
    {
        try {
            $user = $this->userRegistration->register($request);
        } catch (EmailAlreadyExistsException) {
            $status = 409;

            return $this->json(
                [
                    'type' => 'https://datashare.fr/errors/email-already-exists',
                    'title' => 'Email already exists',
                    'status' => $status,
                    'detail' => 'Un compte avec cet email existe déjà.',
                ],
                status: $status,
                headers: ['Content-Type' => 'application/problem+json'],
            );
        }

        return $this->json(
            ['data' => UserResponse::fromUser($user)],
            status: 201,
        );
    }
}
