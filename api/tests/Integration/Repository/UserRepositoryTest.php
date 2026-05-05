<?php

declare(strict_types=1);

namespace App\Tests\Integration\Repository;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class UserRepositoryTest extends KernelTestCase
{
    private UserRepository $repository;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $this->repository = $container->get(UserRepository::class);
        $this->em = $container->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . User::class)->execute();
    }

    public function testFindOneByEmailReturnsUserWhenExists(): void
    {
        $user = $this->makeUser('foo@bar.fr');
        $this->em->persist($user);
        $this->em->flush();

        $found = $this->repository->findOneByEmail('foo@bar.fr');

        $this->assertNotNull($found);
        $this->assertSame('foo@bar.fr', $found->getEmail());
    }

    public function testFindOneByEmailReturnsNullWhenAbsent(): void
    {
        $found = $this->repository->findOneByEmail('absent@bar.fr');

        $this->assertNull($found);
    }

    public function testSavePersistsButDoesNotFlushByDefault(): void
    {
        $user = $this->makeUser('foo@bar.fr');
        $this->repository->save($user);

        $this->em->clear();
        $found = $this->repository->findOneByEmail('foo@bar.fr');

        $this->assertNull($found);
    }

    public function testSaveWithFlushPersistsToDatabase(): void
    {
        $user = $this->makeUser('foo@bar.fr');
        $this->repository->save($user, true);

        $this->em->clear();
        $found = $this->repository->findOneByEmail('foo@bar.fr');

        $this->assertNotNull($found);
        $this->assertSame('foo@bar.fr', $found->getEmail());
    }

    private function makeUser(string $email): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword('hashed_pw_irrelevant_for_repo_tests');

        return $user;
    }
}
