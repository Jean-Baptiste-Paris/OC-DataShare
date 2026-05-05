<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class UserTest extends TestCase
{
    public function testConstructorGeneratesUuidV7(): void
    {
        $user = new User();

        $this->assertInstanceOf(UuidV7::class, $user->getId());
    }

    public function testConstructorSetsCreatedAtToNow(): void
    {
        $before = new DateTimeImmutable();
        $user = new User();
        $after = new DateTimeImmutable();

        $this->assertGreaterThanOrEqual($before, $user->getCreatedAt());
        $this->assertLessThanOrEqual($after, $user->getCreatedAt());
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function emailNormalizationProvider(): iterable
    {
        yield 'lowercase already' => ['foo@bar.fr', 'foo@bar.fr'];
        yield 'uppercase' => ['FOO@BAR.FR', 'foo@bar.fr'];
        yield 'mixed case' => ['Foo@Bar.Fr', 'foo@bar.fr'];
        yield 'leading whitespace' => ['  foo@bar.fr', 'foo@bar.fr'];
        yield 'trailing whitespace' => ['foo@bar.fr  ', 'foo@bar.fr'];
        yield 'tabs and mixed case' => ["\t  Foo@BAR.fr  \t", 'foo@bar.fr'];
    }

    #[DataProvider('emailNormalizationProvider')]
    public function testSetEmailNormalizes(string $input, string $expected): void
    {
        $user = new User();
        $user->setEmail($input);

        $this->assertSame($expected, $user->getEmail());
    }

    public function testSetPasswordStoresValueAsIs(): void
    {
        $user = new User();
        $user->setPassword('whatever_value_no_transform');

        $this->assertSame('whatever_value_no_transform', $user->getPassword());
    }

    public function testGetRolesReturnsRoleUser(): void
    {
        $user = new User();

        $this->assertSame(['ROLE_USER'], $user->getRoles());
    }

    public function testGetUserIdentifierReturnsEmail(): void
    {
        $user = new User();
        $user->setEmail('foo@bar.fr');

        $this->assertSame('foo@bar.fr', $user->getUserIdentifier());
    }

    public function testEraseCredentialsDoesNotThrow(): void
    {
        $user = new User();
        $user->eraseCredentials();

        $this->expectNotToPerformAssertions();
    }
}
