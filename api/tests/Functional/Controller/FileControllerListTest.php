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

final class FileControllerListTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . File::class)->execute();
        $this->em->createQuery('DELETE FROM ' . User::class)->execute();
    }

    public function testListReturns200WithFilesOfAuthenticatedUserOnly(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $bob = $this->seedUser('bob@datashare.fr');
        $this->seedFile($alice, 'alice-1.txt');
        $this->seedFile($alice, 'alice-2.txt');
        $this->seedFile($bob, 'bob.txt');
        $this->em->flush();

        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'GET',
            '/api/files',
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        self::assertArrayHasKey('data', $body);
        self::assertCount(2, $body['data']);

        $names = array_column($body['data'], 'name');
        self::assertContains('alice-1.txt', $names);
        self::assertContains('alice-2.txt', $names);
        self::assertNotContains('bob.txt', $names);

        $first = $body['data'][0];
        self::assertArrayHasKey('id', $first);
        self::assertArrayHasKey('sizeBytes', $first);
        self::assertArrayHasKey('mimeType', $first);
        self::assertArrayHasKey('createdAt', $first);
        self::assertArrayHasKey('status', $first);
        self::assertSame('available', $first['status']);
    }

    public function testListIncludesSoftDeletedFilesWithStatus(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $this->seedFile($alice, 'kept.txt');
        $deleted = $this->seedFile($alice, 'gone.txt');
        $deleted->markDeleted();
        $this->em->flush();

        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'GET',
            '/api/files',
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        $body = json_decode($this->client->getResponse()->getContent(), true);
        self::assertCount(2, $body['data']);

        $byName = [];
        foreach ($body['data'] as $row) {
            $byName[$row['name']] = $row['status'];
        }
        self::assertSame('available', $byName['kept.txt']);
        self::assertSame('deleted', $byName['gone.txt']);
    }

    public function testListReturnsEmptyArrayWhenUserHasNoFile(): void
    {
        $alice = $this->seedUser('alice@datashare.fr');
        $this->em->flush();

        $token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($alice);

        $this->client->request(
            'GET',
            '/api/files',
            server: ['HTTP_AUTHORIZATION' => "Bearer {$token}"],
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $body = json_decode($this->client->getResponse()->getContent(), true);
        self::assertSame([], $body['data']);
    }

    public function testListReturns401WithoutToken(): void
    {
        $this->client->request('GET', '/api/files');

        self::assertSame(
            Response::HTTP_UNAUTHORIZED,
            $this->client->getResponse()->getStatusCode(),
        );
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

    private function seedFile(User $user, string $name): File
    {
        $file = new File($user, $name, 1024, 'text/plain', 'test/' . $name . '.bin');
        $this->em->persist($file);

        return $file;
    }
}
