<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;

class EmailAlreadyExistsException extends RuntimeException
{
    public function __construct(string $email)
    {
        parent::__construct(sprintf('Un compte avec l\'email "%s" existe déjà.', $email));
    }
}
