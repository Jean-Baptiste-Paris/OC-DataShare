<?php

declare(strict_types=1);

namespace App\Service\Upload;

use App\Exception\FileTypeRejectedException;
use finfo;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Mime\MimeTypesInterface;

class FileValidator
{
    /**
     * @param list<string> $blacklistedExtensions extensions without leading dot, lowercased
     */
    public function __construct(
        private readonly array $blacklistedExtensions,
        private readonly MimeTypesInterface $mimeTypes,
    ) {
    }

    /**
     * @return string detected MIME type (to persist on the File entity)
     * @throws FileTypeRejectedException when extension or magic bytes match the blacklist
     */
    public function validate(UploadedFile $file): string
    {
        $clientExtension = strtolower($file->getClientOriginalExtension());
        if ($clientExtension !== '' && in_array($clientExtension, $this->blacklistedExtensions, true)) {
            throw new FileTypeRejectedException(
                FileTypeRejectedException::REASON_BLACKLISTED_EXTENSION,
                sprintf('Extension ".%s" is blacklisted.', $clientExtension),
            );
        }

        $detectedMime = $this->detectMime($file);

        foreach ($this->mimeTypes->getExtensions($detectedMime) as $impliedExtension) {
            if (in_array(strtolower($impliedExtension), $this->blacklistedExtensions, true)) {
                throw new FileTypeRejectedException(
                    FileTypeRejectedException::REASON_SUSPICIOUS_MAGIC_BYTES,
                    sprintf(
                        'File content matches MIME "%s" whose typical extension ".%s" is blacklisted.',
                        $detectedMime,
                        $impliedExtension,
                    ),
                );
            }
        }

        return $detectedMime;
    }

    private function detectMime(UploadedFile $file): string
    {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());
        if ($mime === false) {
            throw new FileTypeRejectedException(
                FileTypeRejectedException::REASON_SUSPICIOUS_MAGIC_BYTES,
                'Cannot detect MIME type from file content.',
            );
        }

        return $mime;
    }
}
