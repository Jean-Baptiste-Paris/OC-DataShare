<?php

declare(strict_types=1);

namespace App\Security;

use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

/**
 * Wrappe la réponse de POST /api/auth/login dans l'enveloppe { data: { token } }
 * pour rester cohérent avec le contrat des autres endpoints (/register).
 */
final class JsonAuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(
        private readonly JWTTokenManagerInterface $tokenManager,
    ) {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): Response
    {
        $jwt = $this->tokenManager->create($token->getUser());

        return new JsonResponse(
            ['data' => ['token' => $jwt]],
            Response::HTTP_OK,
        );
    }
}
