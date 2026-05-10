<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\SharedFile;
use App\Exception\ShareNotFoundException;
use App\Service\Share\ShareService;
use App\Service\Storage\StorageInterface;
use App\Service\Storage\StorageObjectNotFoundException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/share/{token}', name: 'share_')]
class ShareController extends AbstractController
{
    public function __construct(
        private readonly ShareService $shareService,
        private readonly StorageInterface $storage,
    ) {
    }

    #[Route('', name: 'metadata', methods: ['GET'])]
    public function metadata(string $token): JsonResponse
    {
        try {
            $file = $this->shareService->findAvailable($token);
        } catch (ShareNotFoundException) {
            return $this->problemNotFound();
        }

        return $this->json(['data' => SharedFile::fromFile($file)]);
    }

    #[Route('/download', name: 'download', methods: ['GET'])]
    public function download(string $token): Response
    {
        try {
            $file = $this->shareService->findAvailable($token);
        } catch (ShareNotFoundException) {
            return $this->problemNotFound();
        }

        try {
            $handle = $this->storage->openReadStream($file->getStorageKey());
        } catch (StorageObjectNotFoundException) {
            return $this->problemNotFound();
        }

        $response = new StreamedResponse(static function () use ($handle): void {
            try {
                while (!feof($handle)) {
                    echo fread($handle, 8192);
                }
            } finally {
                fclose($handle);
            }
        });

        $response->headers->set('Content-Type', $file->getMimeType());
        $response->headers->set('Content-Length', (string) $file->getSizeBytes());
        $response->headers->set(
            'Content-Disposition',
            HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $file->getName(),
                $this->asciiFallbackName($file->getName()),
            ),
        );

        return $response;
    }

    private function asciiFallbackName(string $name): string
    {
        $translit = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        $ascii = $translit === false ? $name : $translit;
        $ascii = preg_replace('/[^\x20-\x7E]/', '_', $ascii) ?? '';
        $ascii = str_replace(['"', '\\', '%'], '_', $ascii);

        return $ascii === '' ? 'download' : $ascii;
    }

    private function problemNotFound(): JsonResponse
    {
        return $this->json(
            [
                'type' => 'https://datashare.fr/errors/share-not-found',
                'title' => 'Share not found',
                'status' => 404,
                'detail' => "Le lien est invalide ou le fichier n'est plus disponible.",
            ],
            status: 404,
            headers: ['Content-Type' => 'application/problem+json'],
        );
    }
}
