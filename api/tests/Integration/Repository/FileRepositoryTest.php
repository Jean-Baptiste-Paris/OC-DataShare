<?php

declare(strict_types=1);

namespace App\Tests\Integration\Repository;

use App\Entity\File;
use App\Entity\User;
use App\Repository\FileRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class FileRepositoryTest extends KernelTestCase
{
    private FileRepository $repository;
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;

    protected function setUp(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $this->repository = $container->get(FileRepository::class);
        $this->em = $container->get(EntityManagerInterface::class);
        $this->hasher = $container->get(UserPasswordHasherInterface::class);

        $this->em->createQuery('DELETE FROM ' . File::class)->execute();
        $this->em->createQuery('DELETE FROM ' . User::class)->execute();
    }

    public function testFindAllByUserOrdersByCreatedAtDesc(): void
    {
        $user = $this->seedUser('alice@datashare.fr');
        $oldest = $this->seedFile($user, 'old.txt');
        $middle = $this->seedFile($user, 'mid.txt');
        $newest = $this->seedFile($user, 'new.txt');

        // Force createdAt non-monotonic via reflection to assert sort, not insertion order.
        $this->forceCreatedAt($oldest, '2026-05-01T10:00:00+00:00');
        $this->forceCreatedAt($middle, '2026-05-05T10:00:00+00:00');
        $this->forceCreatedAt($newest, '2026-05-10T10:00:00+00:00');
        $this->em->flush();
        $this->em->clear();

        $result = $this->repository->findAllByUserOrderedByCreatedAtDesc(
            $this->em->getRepository(User::class)->findOneBy(['email' => 'alice@datashare.fr']),
        );

        self::assertCount(3, $result);
        self::assertSame('new.txt', $result[0]->getName());
        self::assertSame('mid.txt', $result[1]->getName());
        self::assertSame('old.txt', $result[2]->getName());
    }

    public function testFindAllByUserIncludesSoftDeleted(): void
    {
        $user = $this->seedUser('bob@datashare.fr');
        $this->seedFile($user, 'kept.txt');
        $deleted = $this->seedFile($user, 'gone.txt');
        $deleted->markDeleted();
        $this->em->flush();
        $this->em->clear();

        $result = $this->repository->findAllByUserOrderedByCreatedAtDesc(
            $this->em->getRepository(User::class)->findOneBy(['email' => 'bob@datashare.fr']),
        );

        self::assertCount(2, $result);
        $names = array_map(static fn ($f) => $f->getName(), $result);
        self::assertContains('kept.txt', $names);
        self::assertContains('gone.txt', $names);
    }

    public function testFindAllByUserExcludesOtherUsersFiles(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $bob = $this->seedUser('bob@datashare.fr');
        $this->seedFile($alice, 'alice.txt');
        $this->seedFile($bob, 'bob.txt');
        $this->em->flush();
        $this->em->clear();

        $aliceFresh = $this->em->getRepository(User::class)->findOneBy(['email' => 'alice@datashare.fr']);
        $result = $this->repository->findAllByUserOrderedByCreatedAtDesc($aliceFresh);

        self::assertCount(1, $result);
        self::assertSame('alice.txt', $result[0]->getName());
    }

    public function testFindAllByUserReturnsEmptyArrayWhenUserHasNoFile(): void
    {
        $user = $this->seedUser('lonely@datashare.fr');
        $this->em->flush();
        $this->em->clear();

        $result = $this->repository->findAllByUserOrderedByCreatedAtDesc(
            $this->em->getRepository(User::class)->findOneBy(['email' => 'lonely@datashare.fr']),
        );

        self::assertSame([], $result);
    }

    private function seedUser(string $email): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->hasher->hashPassword($user, 'plainPassword'));
        $this->em->persist($user);

        return $user;
    }

    private function seedFile(User $user, string $name): File
    {
        $file = new File($user, $name, 1024, 'text/plain', 'test/' . $name . '.bin');
        $this->em->persist($file);

        return $file;
    }

    private function forceCreatedAt(File $file, string $iso): void
    {
        $reflection = new \ReflectionProperty($file, 'createdAt');
        $reflection->setValue($file, new DateTimeImmutable($iso));
    }
}
