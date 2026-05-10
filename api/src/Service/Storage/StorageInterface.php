<?php

declare(strict_types=1);

namespace App\Service\Storage;

interface StorageInterface
{
    /**
     * Persist the bytes read from $source at the given storage key.
     *
     * @param resource $source readable stream
     */
    public function store($source, string $key): void;
}
