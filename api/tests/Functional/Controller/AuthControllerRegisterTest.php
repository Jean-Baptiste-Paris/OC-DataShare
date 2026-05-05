<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthControllerRegisterTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . User::class)->execute();
    }

    public function testRegisterSuccessfullyCreatesAccount(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/register',
            content: json_encode(['email' => 'foo@bar.fr', 'password' => 'plainPassword']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('data', $body);
        $this->assertArrayHasKey('id', $body['data']);
        $this->assertSame('foo@bar.fr', $body['data']['email']);
        $this->assertArrayHasKey('createdAt', $body['data']);
    }

    public function testRegisterReturnsConflictWhenEmailAlreadyExists(): void
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $existing = new User();
        $existing->setEmail('foo@bar.fr');
        $existing->setPassword($hasher->hashPassword($existing, 'whatever'));
        $this->em->persist($existing);
        $this->em->flush();

        $this->client->request(
            'POST',
            '/api/auth/register',
            content: json_encode(['email' => 'foo@bar.fr', 'password' => 'newPassword']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_CONFLICT, $response->getStatusCode());
        $this->assertStringContainsString('application/problem+json', $response->headers->get('Content-Type'));

        $body = json_decode($response->getContent(), true);
        $this->assertSame('https://datashare.fr/errors/email-already-exists', $body['type']);
        $this->assertSame('Email already exists', $body['title']);
        $this->assertSame(409, $body['status']);
    }

    public function testRegisterReturnsUnprocessableForInvalidEmail(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/register',
            content: json_encode(['email' => 'not-an-email', 'password' => 'plainPassword']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertSame(
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testRegisterReturnsUnprocessableForShortPassword(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/register',
            content: json_encode(['email' => 'foo@bar.fr', 'password' => 'short']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertSame(
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testRegisterRejectsMissingFields(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/register',
            content: json_encode(['email' => 'foo@bar.fr']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $statusCode = $this->client->getResponse()->getStatusCode();
        $this->assertGreaterThanOrEqual(400, $statusCode);
        $this->assertLessThan(500, $statusCode);
    }
}
