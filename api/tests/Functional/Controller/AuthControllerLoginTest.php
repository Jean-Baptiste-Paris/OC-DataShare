<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthControllerLoginTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);

        $this->em->createQuery('DELETE FROM ' . User::class)->execute();

        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail('foo@bar.fr');
        $user->setPassword($hasher->hashPassword($user, 'plainPassword'));
        $this->em->persist($user);
        $this->em->flush();
    }

    public function testLoginReturnsTokenOnValidCredentials(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            content: json_encode(['email' => 'foo@bar.fr', 'password' => 'plainPassword']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('data', $body);
        $this->assertArrayHasKey('token', $body['data']);
        $this->assertNotEmpty($body['data']['token']);
    }

    public function testLoginReturns401OnWrongPassword(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            content: json_encode(['email' => 'foo@bar.fr', 'password' => 'wrongPassword']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertSame(
            Response::HTTP_UNAUTHORIZED,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testLoginReturns401OnUnknownUserWithSameMessage(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            content: json_encode(['email' => 'unknown@bar.fr', 'password' => 'whatever']),
            server: ['CONTENT_TYPE' => 'application/json'],
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        // Anti-énumération : le message doit être identique à celui d'un mauvais mdp.
        $body = json_decode($response->getContent(), true);
        $this->assertSame('Invalid credentials.', $body['message']);
    }
}
