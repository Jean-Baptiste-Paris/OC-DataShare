<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;

class FileTypeRejectedException extends RuntimeException
{
    public const string REASON_BLACKLISTED_EXTENSION = 'blacklisted_extension';
    public const string REASON_SUSPICIOUS_MAGIC_BYTES = 'suspicious_magic_bytes';

    public function __construct(
        public readonly string $reason,
        public readonly string $detail,
    ) {
        parent::__construct(sprintf('File type rejected (%s): %s', $reason, $detail));
    }
}
