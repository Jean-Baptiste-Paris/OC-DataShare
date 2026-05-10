<?php

declare(strict_types=1);

namespace App\Service\Share;

use App\Entity\File;
use App\Exception\ShareNotFoundException;
use App\Repository\FileRepository;
use Symfony\Component\Uid\Uuid;
use Throwable;

class ShareService
{
    public function __construct(
        private readonly FileRepository $repository,
    ) {
    }

    /**
     * Resolve a public share token (UUID) to an available File.
     *
     * 404 unifie « token jamais émis » et « fichier supprimé » (deletedAt) — la
     * granularité serait un canal d'énumération côté destinataire.
     *
     * @throws ShareNotFoundException token absent, mal formé OU pointant sur un fichier soft-deleted
     */
    public function findAvailable(string $token): File
    {
        try {
            $uuid = Uuid::fromString($token);
        } catch (Throwable) {
            throw new ShareNotFoundException();
        }

        $file = $this->repository->find($uuid);
        if ($file === null || !$file->isAvailable()) {
            throw new ShareNotFoundException();
        }

        return $file;
    }
}
