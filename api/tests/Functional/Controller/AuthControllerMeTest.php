<?php

declare(strict_types=1);

namespace App\Tests\Functional\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthControllerMeTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private User $user;

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

        $this->user = $user;
    }

    public function testMeReturnsCurrentUserWithValidToken(): void
    {
        $tokenManager = static::getContainer()->get(JWTTokenManagerInterface::class);
        $token = $tokenManager->create($this->user);

        $this->client->request(
            'GET',
            '/api/auth/me',
            server: ['HTTP_AUTHORIZATION' => "Bearer $token"],
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        $this->assertSame('foo@bar.fr', $body['data']['email']);
        $this->assertArrayHasKey('id', $body['data']);
        $this->assertArrayHasKey('createdAt', $body['data']);
    }

    public function testMeReturns401WithoutToken(): void
    {
        $this->client->request('GET', '/api/auth/me');

        $this->assertSame(
            Response::HTTP_UNAUTHORIZED,
            $this->client->getResponse()->getStatusCode(),
        );
    }

    public function testMeReturns401WithInvalidToken(): void
    {
        $this->client->request(
            'GET',
            '/api/auth/me',
            server: ['HTTP_AUTHORIZATION' => 'Bearer not.a.valid.jwt.token'],
        );

        $this->assertSame(
            Response::HTTP_UNAUTHORIZED,
            $this->client->getResponse()->getStatusCode(),
        );
    }
}
