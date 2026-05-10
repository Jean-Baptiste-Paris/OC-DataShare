<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\FileSummary;
use App\Entity\User;
use App\Exception\FileTypeRejectedException;
use App\Service\Upload\FileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/files', name: 'files_')]
class FileController extends AbstractController
{
    public function __construct(
        private readonly FileService $fileService,
    ) {
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
