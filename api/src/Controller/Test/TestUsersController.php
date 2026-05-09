<?php

declare(strict_types=1);

namespace App\Controller\Test;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/test', name: 'test_')]
final class TestUsersController extends AbstractController
{
    public function __construct(
        private readonly KernelInterface $kernel,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Vide la table users. Utilisé par Cypress entre tests E2E.
     * 404 hors environnement test pour éviter toute exposition en prod.
     */
    #[Route('/users/reset', name: 'users_reset', methods: ['POST'])]
    public function resetUsers(): JsonResponse
    {
        if ($this->kernel->getEnvironment() !== 'test') {
            throw new NotFoundHttpException();
        }

        $this->em->createQuery('DELETE FROM ' . User::class)->execute();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
