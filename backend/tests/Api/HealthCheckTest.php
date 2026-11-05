<?php

namespace App\Tests\Api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class HealthCheckTest extends WebTestCase
{
    public function testHealthCheckReturnsOk(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/health');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $responseContent = (string) $client->getResponse()->getContent();
        /** @var array{status?: string} $data */
        $data = json_decode($responseContent, true);

        $this->assertSame('ok', $data['status'] ?? null);
    }
}
