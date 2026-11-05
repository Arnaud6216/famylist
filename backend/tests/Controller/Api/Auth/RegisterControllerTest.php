<?php

namespace App\Tests\Controller\Api\Auth;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class RegisterControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $passwordHasher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->entityManager = $em;

        /** @var UserRepository $userRepo */
        $userRepo = static::getContainer()->get(UserRepository::class);
        $this->userRepository = $userRepo;

        /** @var UserPasswordHasherInterface $hasher */
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $this->passwordHasher = $hasher;

        // Réinitialise la table users pour garantir l'isolation des tests
        $this->entityManager->getConnection()->executeStatement('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    }

    public function testNominalRegistration(): void
    {
        $payload = [
            'firstName' => 'Arnaud',
            'lastName' => 'Guevaer',
            'email' => 'arnaud@famylist.fr',
            'password' => 'Password123!',
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $this->assertResponseHeaderSame('content-type', 'application/json');

        /** @var array{message?: string, user?: array{id?: int, email?: string, firstName?: string, lastName?: string, createdAt?: string}} $data */
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame('Inscription réussie.', $data['message'] ?? null);
        $this->assertIsArray($data['user'] ?? null);
        $this->assertIsInt($data['user']['id'] ?? null);
        $this->assertSame('arnaud@famylist.fr', $data['user']['email'] ?? null);
        $this->assertSame('Arnaud', $data['user']['firstName'] ?? null);
        $this->assertSame('Guevaer', $data['user']['lastName'] ?? null);
        $this->assertNotEmpty($data['user']['createdAt'] ?? null);

        // Vérification en base de données
        $user = $this->userRepository->findOneBy(['email' => 'arnaud@famylist.fr']);
        $this->assertInstanceOf(User::class, $user);
        $this->assertSame('Arnaud', $user->getFirstName());
        $this->assertSame('Guevaer', $user->getLastName());

        // Le mot de passe ne doit JAMAIS être en clair
        $this->assertNotSame('Password123!', $user->getPassword());
        // L'algorithme utilisé doit être Argon2id ($argon2id$...)
        $this->assertStringStartsWith('$argon2id$', $user->getPassword());
        // Vérification du mot de passe avec le hasher Symfony
        $this->assertTrue($this->passwordHasher->isPasswordValid($user, 'Password123!'));
        $this->assertFalse($this->passwordHasher->isPasswordValid($user, 'MauvaisMotDePasse!'));
    }

    public function testDuplicateEmailReturns422(): void
    {
        $payload = [
            'firstName' => 'Arnaud',
            'lastName' => 'Guevaer',
            'email' => 'arnaud@famylist.fr',
            'password' => 'Password123!',
        ];

        // Première inscription
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($payload)
        );
        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        // Seconde inscription avec le même email
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);

        /** @var array{message?: string, errors?: array{email?: list<string>}} $data */
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame('Cette adresse email est déjà utilisée.', $data['message'] ?? null);
        $this->assertSame(
            ['Cette adresse email est déjà utilisée.'],
            $data['errors']['email'] ?? null
        );
    }

    public function testInvalidDataReturns422(): void
    {
        $payload = [
            'firstName' => '',
            'lastName' => 'G',
            'email' => 'email-non-valide',
            'password' => 'court',
        ];

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);

        /** @var array{message?: string, errors?: array<string, list<string>>} $data */
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame('Données non conformes.', $data['message'] ?? null);
        $this->assertArrayHasKey('firstName', $data['errors'] ?? []);
        $this->assertArrayHasKey('lastName', $data['errors'] ?? []);
        $this->assertArrayHasKey('email', $data['errors'] ?? []);
        $this->assertArrayHasKey('password', $data['errors'] ?? []);
    }

    public function testEmptyBodyReturns400(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            ''
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        /** @var array{message?: string} $data */
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Corps de la requête vide.', $data['message'] ?? null);
    }
}
