<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Exception\EmailAlreadyExistsException;
use App\Repository\UserRepository;
use App\Service\UserRegistrationService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserRegistrationServiceTest extends TestCase
{
    public function testRegisterCreatesUserWhenEmailIsAvailable(): void
    {
        $repository = $this->createMock(UserRepository::class);
        $hasher = $this->createStub(UserPasswordHasherInterface::class);

        $repository->expects($this->once())
            ->method('findOneByEmail')
            ->with('foo@bar.fr')
            ->willReturn(null);
        $hasher->method('hashPassword')->willReturn('hashed_pw');
        $repository->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(User::class), true);

        $service = new UserRegistrationService($repository, $hasher);

        $user = $service->register(new RegisterRequest('foo@bar.fr', 'plainPassword'));

        $this->assertSame('foo@bar.fr', $user->getEmail());
        $this->assertSame('hashed_pw', $user->getPassword());
    }

    public function testRegisterThrowsWhenEmailAlreadyExists(): void
    {
        $repository = $this->createMock(UserRepository::class);
        $hasher = $this->createStub(UserPasswordHasherInterface::class);

        $repository->expects($this->once())
            ->method('findOneByEmail')
            ->with('foo@bar.fr')
            ->willReturn(new User());
        $repository->expects($this->never())->method('save');

        $service = new UserRegistrationService($repository, $hasher);

        $this->expectException(EmailAlreadyExistsException::class);
        $service->register(new RegisterRequest('foo@bar.fr', 'plainPassword'));
    }

    public function testRegisterNormalizesEmailBeforeLookup(): void
    {
        $repository = $this->createMock(UserRepository::class);
        $hasher = $this->createStub(UserPasswordHasherInterface::class);

        $repository->expects($this->once())
            ->method('findOneByEmail')
            ->with('foo@bar.fr')
            ->willReturn(null);
        $hasher->method('hashPassword')->willReturn('hashed_pw');

        $service = new UserRegistrationService($repository, $hasher);

        $user = $service->register(new RegisterRequest('  Foo@BAR.fr  ', 'plainPassword'));

        $this->assertSame('foo@bar.fr', $user->getEmail());
    }

    public function testRegisterPassesPlainPasswordToHasher(): void
    {
        $repository = $this->createStub(UserRepository::class);
        $hasher = $this->createMock(UserPasswordHasherInterface::class);

        $repository->method('findOneByEmail')->willReturn(null);
        $hasher->expects($this->once())
            ->method('hashPassword')
            ->with($this->isInstanceOf(User::class), 'plainPassword')
            ->willReturn('hashed_pw');

        $service = new UserRegistrationService($repository, $hasher);

        $service->register(new RegisterRequest('foo@bar.fr', 'plainPassword'));
    }
}
