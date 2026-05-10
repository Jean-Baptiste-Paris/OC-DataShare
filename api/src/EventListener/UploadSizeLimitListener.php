<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class UploadSizeLimitListener
{
    public function __construct(
        private readonly int $maxBytes,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!in_array($request->getMethod(), ['POST', 'PUT', 'PATCH'], true)) {
            return;
        }

        $contentLength = $request->headers->get('Content-Length');
        if ($contentLength === null) {
            return;
        }

        if ((int) $contentLength <= $this->maxBytes) {
            return;
        }

        $event->setResponse(new JsonResponse(
            [
                'type' => 'https://datashare.fr/errors/file-too-large',
                'title' => 'File too large',
                'status' => 413,
                'detail' => 'La taille du fichier dépasse la limite autorisée (1 Go).',
            ],
            status: 413,
            headers: ['Content-Type' => 'application/problem+json'],
        ));
    }
}
