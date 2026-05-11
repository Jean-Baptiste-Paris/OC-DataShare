<?php

declare(strict_types=1);

namespace App\Service\Deletion;

use App\Entity\File;
use App\Service\Storage\StorageInterface;
use Doctrine\ORM\EntityManagerInterface;

class FileDeletionService
{
    public function __construct(
        private readonly StorageInterface $storage,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Supprime le blob du storage puis marque l'entité comme supprimée
     * (soft delete via deletedAt). L'ordre est important : si la BDD est
     * marquée avant la purge storage et que la purge échoue, on a un orphan
     * inverse (entrée invisible mais blob présent). L'ordre actuel tolère
     * un orphan blob (purge OK + flush KO = blob déjà parti, doit être
     * géré par un GC ultérieur en V2).
     */
    public function delete(File $file): void
    {
        $this->storage->delete($file->getStorageKey());
        $file->markDeleted();
        $this->em->flush();
    }
}
