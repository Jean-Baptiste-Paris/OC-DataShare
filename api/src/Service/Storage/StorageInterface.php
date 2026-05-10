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

    /**
     * Open a readable stream on the bytes previously stored at $key.
     *
     * @return resource readable stream — caller is responsible for fclose().
     * @throws StorageObjectNotFoundException when no object exists for $key
     */
    public function openReadStream(string $key);
}
