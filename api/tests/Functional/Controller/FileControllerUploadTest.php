<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\File;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class FileControllerUploadTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private User $user;
    private string $token;
    private string $storageRoot;

    /** @var list<string> */
    private array $tempFiles = [];

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . File::class)->execute();
        $this->em->createQuery('DELETE FROM ' . User::class)->execute();

        $hasher = $container->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail('uploader@datashare.fr');
        $user->setPassword($hasher->hashPassword($user, 'plainPassword'));
        $this->em->persist($user);
        $this->em->flush();
        $this->user = $user;

        $this->token = $container->get(JWTTokenManagerInterface::class)->create($user);
        $this->storageRoot = $container->getParameter('kernel.project_dir') . '/var/storage_test';
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->tempFiles = [];

        if (is_dir($this->storageRoot)) {
            $this->removeDirectory($this->storageRoot);
        }
    }

    public function testUploadReturns201WithFileSummary(): void
    {
        $upload = $this->makeUploadedFile('readme.txt', 'Hello world');

        $this->client->request(
            'POST',
            '/api/files',
            files: ['file' => $upload],
            server: ['HTTP_AUTHORIZATION' => "Bearer {$this->token}"],
        );

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        self::assertArrayHasKey('data', $body);
        self::assertArrayHasKey('id', $body['data']);
        self::assertSame('readme.txt', $body['data']['name']);
        self::assertSame(11, $body['data']['sizeBytes']);
        self::assertSame('text/plain', $body['data']['mimeType']);
        self::assertArrayHasKey('createdAt', $body['data']);
    }

    public function testUploadReturns400WhenFileFieldIsMissing(): void
    {
        $this->client->request(
            'POST',
            '/api/files',
            server: ['HTTP_AUTHORIZATION' => "Bearer {$this->token}"],
        );

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        self::assertStringContainsString(
            'application/problem+json',
            $response->headers->get('Content-Type'),
        );

        $body = json_decode($response->getContent(), true);
        self::assertSame('https://datashare.fr/errors/file-missing', $body['type']);
        self::assertSame(400, $body['status']);
    }

    public function testUploadReturns415ForBlacklistedExtension(): void
    {
        $upload = $this->makeUploadedFile('malware.exe', 'arbitrary');

        $this->client->request(
            'POST',
            '/api/files',
            files: ['file' => $upload],
            server: ['HTTP_AUTHORIZATION' => "Bearer {$this->token}"],
        );

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_UNSUPPORTED_MEDIA_TYPE, $response->getStatusCode());
        self::assertStringContainsString(
            'application/problem+json',
            $response->headers->get('Content-Type'),
        );

        $body = json_decode($response->getContent(), true);
        self::assertSame('https://datashare.fr/errors/file-type-rejected', $body['type']);
        self::assertSame(415, $body['status']);
    }

    public function testUploadReturns401WithoutToken(): void
    {
        $upload = $this->makeUploadedFile('readme.txt', 'Hello world');

        $this->client->request('POST', '/api/files', files: ['file' => $upload]);

        self::assertSame(
            Response::HTTP_UNAUTHORIZED,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    private function makeUploadedFile(string $clientName, string $bytes): UploadedFile
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'datashare-fc-');
        if ($tempPath === false) {
            self::fail('Cannot create temp file for test.');
        }
        file_put_contents($tempPath, $bytes);
        $this->tempFiles[] = $tempPath;

        return new UploadedFile(
            path: $tempPath,
            originalName: $clientName,
            mimeType: null,
            error: UPLOAD_ERR_OK,
            test: true,
        );
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
