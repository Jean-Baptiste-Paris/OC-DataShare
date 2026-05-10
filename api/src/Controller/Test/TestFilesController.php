<?php

declare(strict_types=1);

namespace App\Controller\Test;

use App\Entity\File;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/test', name: 'test_')]
final class TestFilesController extends AbstractController
{
    public function __construct(
        private readonly KernelInterface $kernel,
        private readonly EntityManagerInterface $em,
        private readonly string $storagePath,
    ) {
    }

    /**
     * Vide la table files et le dossier de stockage test.
     * Utilisé par Cypress entre tests E2E.
     * 404 hors environnement test pour éviter toute exposition en prod.
     */
    #[Route('/files/reset', name: 'files_reset', methods: ['POST'])]
    public function resetFiles(): JsonResponse
    {
        if ($this->kernel->getEnvironment() !== 'test') {
            throw new NotFoundHttpException();
        }

        $this->em->createQuery('DELETE FROM ' . File::class)->execute();

        if (is_dir($this->storagePath)) {
            (new Filesystem())->remove($this->storagePath);
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
