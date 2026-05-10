<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Share;

use App\Entity\File;
use App\Entity\User;
use App\Exception\ShareNotFoundException;
use App\Repository\FileRepository;
use App\Service\Share\ShareService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;

final class ShareServiceTest extends TestCase
{
    public function testFindAvailableReturnsFileWhenAvailable(): void
    {
        $user = new User();
        $file = new File($user, 'rapport.pdf', 1024, 'application/pdf', '2026/05/abc.bin');
        $token = $file->getId()->toRfc4122();

        $repository = $this->createMock(FileRepository::class);
        $repository->expects($this->once())
            ->method('find')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($file->getId())))
            ->willReturn($file);

        $service = new ShareService($repository);

        self::assertSame($file, $service->findAvailable($token));
    }

    public function testFindAvailableThrowsWhenTokenIsMalformed(): void
    {
        $repository = $this->createMock(FileRepository::class);
        $repository->expects($this->never())->method('find');

        $service = new ShareService($repository);

        $this->expectException(ShareNotFoundException::class);
        $service->findAvailable('not-a-uuid');
    }

    public function testFindAvailableThrowsWhenRepositoryReturnsNull(): void
    {
        $repository = $this->createMock(FileRepository::class);
        $repository->method('find')->willReturn(null);

        $service = new ShareService($repository);

        $this->expectException(ShareNotFoundException::class);
        $service->findAvailable(Uuid::v7()->toRfc4122());
    }

    public function testFindAvailableThrowsWhenFileIsSoftDeleted(): void
    {
        $file = new File(new User(), 'rapport.pdf', 1024, 'application/pdf', '2026/05/abc.bin');
        $file->markDeleted();

        $repository = $this->createMock(FileRepository::class);
        $repository->method('find')->willReturn($file);

        $service = new ShareService($repository);

        $this->expectException(ShareNotFoundException::class);
        $service->findAvailable($file->getId()->toRfc4122());
    }
}
