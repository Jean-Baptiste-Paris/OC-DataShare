<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\File;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<File>
 */
class FileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, File::class);
    }

    public function save(File $file, bool $flush = false): void
    {
        $this->getEntityManager()->persist($file);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Liste tous les fichiers d'un user (disponibles + soft-deleted),
     * du plus récent au plus ancien. Le filtrage par état est appliqué
     * côté front via le Switch « Tous / Disponibles / Supprimés ».
     * S'appuie sur l'index composite `(user_id, created_at DESC)`.
     *
     * @return list<File>
     */
    public function findAllByUserOrderedByCreatedAtDesc(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->andWhere('f.user = :user')
            ->setParameter('user', $user)
            ->orderBy('f.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
