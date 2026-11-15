<?php

declare(strict_types=1);

namespace App\Tests\Controller\Api\Auth;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->entityManager = $em;

        /** @var UserPasswordHasherInterface $hasher */
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $this->passwordHasher = $hasher;

        // Isolation des tests : remise à zéro de la table users
        $this->entityManager->getConnection()->executeStatement('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    }

    private function createTestUser(string $email = 'arnaud@famylist.fr', string $plainPassword = 'Password123!'): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Arnaud');
        $user->setLastName('Guevaer');
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function testSuccessfulLoginWithValidCredentials(): void
    {
        $this->createTestUser('arnaud@famylist.fr', 'Password123!');

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'arnaud@famylist.fr',
                'password' => 'Password123!',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertTrue($response->headers->contains('content-type', 'application/json'));

        /** @var array{message: string, user: array{id: int, email: string, firstName: string, lastName: string, roles: list<string>}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('Connexion réussie.', $data['message']);
        $this->assertSame('arnaud@famylist.fr', $data['user']['email']);
        $this->assertSame('Arnaud', $data['user']['firstName']);
        $this->assertSame('Guevaer', $data['user']['lastName']);
        $this->assertContains('ROLE_USER', $data['user']['roles']);
    }

    public function testLoginFailsWithInvalidPassword(): void
    {
        $this->createTestUser('arnaud@famylist.fr', 'Password123!');

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'arnaud@famylist.fr',
                'password' => 'WrongPassword999!',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        /** @var array{message: string} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Identifiants invalides.', $data['message']);
    }

    public function testLoginFailsWithNonExistentEmail(): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'inconnu@famylist.fr',
                'password' => 'Password123!',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        /** @var array{message: string} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Identifiants invalides.', $data['message']);
    }

    public function testMeEndpointReturnsAuthenticatedUserProfile(): void
    {
        $this->createTestUser('arnaud@famylist.fr', 'Password123!');

        // 1. Authentification
        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'arnaud@famylist.fr',
                'password' => 'Password123!',
            ], JSON_THROW_ON_ERROR)
        );
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        // 2. Appel de /api/me avec la session active
        $this->client->request('GET', '/api/me');
        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        /** @var array{user: array{id: int, email: string, firstName: string, lastName: string}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('arnaud@famylist.fr', $data['user']['email']);
        $this->assertSame('Arnaud', $data['user']['firstName']);
        $this->assertSame('Guevaer', $data['user']['lastName']);
    }

    public function testMeEndpointReturnsUnauthorizedWhenAnonymous(): void
    {
        $this->client->request('GET', '/api/me');
        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        /** @var array{message: string} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Non authentifié.', $data['message']);
    }

    public function testLogoutTerminatesActiveSession(): void
    {
        $this->createTestUser('arnaud@famylist.fr', 'Password123!');

        // 1. Connexion
        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'arnaud@famylist.fr',
                'password' => 'Password123!',
            ], JSON_THROW_ON_ERROR)
        );
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        // 2. Déconnexion
        $this->client->request('POST', '/api/logout');
        $logoutResponse = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $logoutResponse->getStatusCode());

        /** @var array{message: string} $logoutData */
        $logoutData = json_decode((string) $logoutResponse->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Déconnexion réussie.', $logoutData['message']);

        // 3. Vérification que /api/me est désormais non autorisé
        $this->client->request('GET', '/api/me');
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }
}
