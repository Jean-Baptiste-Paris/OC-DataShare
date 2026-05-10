<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\File;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

final class ShareControllerTest extends WebTestCase
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

    public function testGetMetadataReturns200WithSharedFileEnvelope(): void
    {
        $file = $this->seedFile('rapport.pdf', 'pdf-bytes', 'application/pdf');

        $this->client->request('GET', '/api/share/' . $file->getId()->toRfc4122());

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        self::assertArrayHasKey('data', $body);
        self::assertSame('rapport.pdf', $body['data']['name']);
        self::assertSame(strlen('pdf-bytes'), $body['data']['sizeBytes']);
        self::assertSame('application/pdf', $body['data']['mimeType']);
        self::assertArrayHasKey('createdAt', $body['data']);
        self::assertArrayNotHasKey('id', $body['data']);
        self::assertArrayNotHasKey('user', $body['data']);
    }

    public function testGetMetadataReturns404ForUnknownToken(): void
    {
        $this->client->request('GET', '/api/share/' . Uuid::v7()->toRfc4122());

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertStringContainsString(
            'application/problem+json',
            $response->headers->get('Content-Type'),
        );

        $body = json_decode($response->getContent(), true);
        self::assertSame('https://datashare.fr/errors/share-not-found', $body['type']);
    }

    public function testGetMetadataReturns404ForMalformedToken(): void
    {
        $this->client->request('GET', '/api/share/not-a-uuid');

        self::assertSame(
            Response::HTTP_NOT_FOUND,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testGetMetadataReturns404ForSoftDeletedFile(): void
    {
        $file = $this->seedFile('rapport.pdf', 'pdf-bytes', 'application/pdf');
        $file->markDeleted();
        $this->em->flush();

        $this->client->request('GET', '/api/share/' . $file->getId()->toRfc4122());

        self::assertSame(
            Response::HTTP_NOT_FOUND,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testDownloadReturnsStreamWithExpectedHeaders(): void
    {
        $bytes = "binary-content-here\x00\x01";
        $file = $this->seedFile('rapport_éàü.pdf', $bytes, 'application/pdf');

        $this->client->request('GET', '/api/share/' . $file->getId()->toRfc4122() . '/download');

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('application/pdf', $response->headers->get('Content-Type'));
        self::assertSame((string) strlen($bytes), $response->headers->get('Content-Length'));

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('attachment;', $disposition);
        self::assertStringContainsString("filename=", $disposition);
        self::assertStringContainsString("filename*=utf-8''", $disposition);

        self::assertInstanceOf(StreamedResponse::class, $response);
    }

    public function testDownloadReturns404ForUnknownToken(): void
    {
        $this->client->request('GET', '/api/share/' . Uuid::v7()->toRfc4122() . '/download');

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        self::assertStringContainsString(
            'application/problem+json',
            $response->headers->get('Content-Type'),
        );
    }

    private function seedFile(string $name, string $bytes, string $mime): File
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail('owner-' . bin2hex(random_bytes(4)) . '@datashare.fr');
        $user->setPassword($hasher->hashPassword($user, 'plainPassword'));
        $this->em->persist($user);

        $storageKey = sprintf('test/%s.bin', Uuid::v7()->toRfc4122());
        $absolutePath = $this->storageRoot . '/' . $storageKey;
        if (!is_dir(dirname($absolutePath))) {
            mkdir(dirname($absolutePath), 0755, true);
        }
        file_put_contents($absolutePath, $bytes);

        $file = new File($user, $name, strlen($bytes), $mime, $storageKey);
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
