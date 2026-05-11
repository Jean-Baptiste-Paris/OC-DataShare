<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\File;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

final class FileControllerDeleteTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private string $storageRoot;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . File::class)->execute();
        $this->em->createQuery('DELETE FROM ' . User::class)->execute();

        $this->storageRoot = $container->getParameter('kernel.project_dir') . '/var/storage_test';
    }

    protected function tearDown(): void
    {
        if (is_dir($this->storageRoot)) {
            $this->removeDirectory($this->storageRoot);
        }
    }

    public function testDeleteReturns204AndSoftDeletesAndPurgesBlob(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $file = $this->seedFileWithBlob($alice, 'rapport.pdf', 'pdf-bytes');
        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $blobPath = $this->storageRoot . '/' . $file->getStorageKey();
        self::assertFileExists($blobPath);

        $this->client->request(
            'DELETE',
            '/api/files/' . $file->getId()->toRfc4122(),
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());

        // Blob purgé
        self::assertFileDoesNotExist($blobPath);

        // Entité soft-deleted (deletedAt NOT NULL) : refresh depuis la BDD
        $this->em->clear();
        $reloaded = $this->em->getRepository(File::class)->find($file->getId());
        self::assertNotNull($reloaded);
        self::assertFalse($reloaded->isAvailable());
    }

    public function testDeleteReturns404WhenFileBelongsToAnotherUser(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $bob = $this->seedUser('bob@datashare.fr');
        $bobFile = $this->seedFileWithBlob($bob, 'bob.pdf', 'bob-bytes');
        $aliceToken = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'DELETE',
            '/api/files/' . $bobFile->getId()->toRfc4122(),
            server: ['HTTP_AUTHORIZATION' => "Bearer {$aliceToken}"],
        );

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        // Le blob de Bob n'a pas été touché — anti-énumération vérifiée bout-en-bout
        $this->em->clear();
        $reloaded = $this->em->getRepository(File::class)->find($bobFile->getId());
        self::assertTrue($reloaded->isAvailable());
        self::assertFileExists($this->storageRoot . '/' . $bobFile->getStorageKey());
    }

    public function testDeleteReturns404ForUnknownId(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $this->em->flush();
        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'DELETE',
            '/api/files/' . Uuid::v7()->toRfc4122(),
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testDeleteReturns404ForAlreadySoftDeletedFile(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $file = $this->seedFileWithBlob($alice, 'old.pdf', 'old-bytes');
        $file->markDeleted();
        $this->em->flush();
        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'DELETE',
            '/api/files/' . $file->getId()->toRfc4122(),
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testDeleteReturns401WithoutToken(): void
    {
        $this->client->request('DELETE', '/api/files/' . Uuid::v7()->toRfc4122());
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    private function seedUser(string $email): User
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($hasher->hashPassword($user, 'plainPassword'));
        $this->em->persist($user);

        return $user;
    }

    private function seedFileWithBlob(User $user, string $name, string $bytes): File
    {
        $storageKey = sprintf('test/%s.bin', Uuid::v7()->toRfc4122());
        $absolutePath = $this->storageRoot . '/' . $storageKey;
        if (!is_dir(dirname($absolutePath))) {
            mkdir(dirname($absolutePath), 0755, true);
        }
        file_put_contents($absolutePath, $bytes);

        $file = new File($user, $name, strlen($bytes), 'application/pdf', $storageKey);
        $this->em->persist($file);
        $this->em->flush();

        return $file;
    }

    private function removeDirectory(string $dir): void
    {
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
