<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\FileSummary;
use App\Entity\User;
use App\Exception\FileTypeRejectedException;
use App\Repository\FileRepository;
use App\Service\Deletion\FileDeletionService;
use App\Service\Upload\FileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;
use Throwable;

#[Route('/api/files', name: 'files_')]
class FileController extends AbstractController
{
    public function __construct(
        private readonly FileService $fileService,
        private readonly FileRepository $fileRepository,
        private readonly FileDeletionService $fileDeletionService,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $files = $this->fileRepository->findAllByUserOrderedByCreatedAtDesc($user);

        return $this->json([
            'data' => array_map(static fn ($file) => FileSummary::fromFile($file), $files),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        try {
            $uuid = Uuid::fromString($id);
        } catch (Throwable) {
            return $this->problemNotFound();
        }

        $file = $this->fileRepository->find($uuid);
        // 404 unifié : inexistant OU déjà supprimé OU appartenant à un autre user.
        // Anti-énumération d'IDs (cf. contrat-interface §4.6, OWASP A01).
        if ($file === null || !$file->isAvailable() || $file->getUser() !== $user) {
            return $this->problemNotFound();
        }

        $this->fileDeletionService->delete($file);

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    private function problemNotFound(): JsonResponse
    {
        return $this->json(
            [
                'type' => 'https://datashare.fr/errors/file-not-found',
                'title' => 'File not found',
                'status' => 404,
                'detail' => 'Le fichier demandé est introuvable.',
            ],
            status: 404,
            headers: ['Content-Type' => 'application/problem+json'],
        );
    }

    #[Route('', name: 'upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $uploadedFile = $request->files->get('file');
        if ($uploadedFile === null) {
            return $this->json(
                [
                    'type' => 'https://datashare.fr/errors/file-missing',
                    'title' => 'File missing',
                    'status' => 400,
                    'detail' => 'Le champ "file" est requis dans la requête multipart.',
                ],
                status: 400,
                headers: ['Content-Type' => 'application/problem+json'],
            );
        }

        /** @var User $user */
        $user = $this->getUser();

        try {
            $file = $this->fileService->upload($uploadedFile, $user);
        } catch (FileTypeRejectedException $e) {
            return $this->json(
                [
                    'type' => 'https://datashare.fr/errors/file-type-rejected',
                    'title' => 'File type rejected',
                    'status' => 415,
                    'detail' => $e->detail,
                ],
                status: 415,
                headers: ['Content-Type' => 'application/problem+json'],
            );
        }

        return $this->json(
            ['data' => FileSummary::fromFile($file)],
            status: 201,
        );
    }
}
