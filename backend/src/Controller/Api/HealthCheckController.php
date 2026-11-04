<?php

namespace App\Controller\Api;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Routing\Attribute\Route;

class HealthCheckController extends AbstractController
{
    public function __construct(
        private readonly Connection $connection,
    ) {
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        try {
            $dbVersion = $this->connection->fetchOne('SELECT version()');

            return new JsonResponse([
                'status' => 'ok',
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                'php_version' => PHP_VERSION,
                'symfony_version' => Kernel::VERSION,
                'database' => [
                    'status' => 'connected',
                    'version' => $dbVersion,
                ],
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'status' => 'error',
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                'php_version' => PHP_VERSION,
                'symfony_version' => Kernel::VERSION,
                'database' => [
                    'status' => 'disconnected',
                    'error' => $e->getMessage(),
                ],
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }
    }
}
