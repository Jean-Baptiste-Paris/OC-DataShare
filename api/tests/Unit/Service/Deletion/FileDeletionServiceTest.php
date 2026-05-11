<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Deletion;

use App\Entity\File;
use App\Entity\User;
use App\Service\Deletion\FileDeletionService;
use App\Service\Storage\StorageInterface;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class FileDeletionServiceTest extends TestCase
{
    public function testDeletePurgesStorageThenSoftDeletesEntityThenFlushes(): void
    {
        $file = new File(new User(), 'rapport.pdf', 1024, 'application/pdf', '2026/05/abc.bin');
        self::assertTrue($file->isAvailable());

        $storage = $this->createMock(StorageInterface::class);
        $em = $this->createMock(EntityManagerInterface::class);

        $callOrder = [];
        $storage->expects($this->once())
            ->method('delete')
            ->with('2026/05/abc.bin')
            ->willReturnCallback(function () use (&$callOrder): void {
                $callOrder[] = 'storage.delete';
            });
        $em->expects($this->once())
            ->method('flush')
            ->willReturnCallback(function () use (&$callOrder): void {
                $callOrder[] = 'em.flush';
            });

        $service = new FileDeletionService($storage, $em);
        $service->delete($file);

        self::assertFalse($file->isAvailable());
        self::assertSame(['storage.delete', 'em.flush'], $callOrder);
    }
}
