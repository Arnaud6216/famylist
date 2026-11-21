<?php

declare(strict_types=1);

namespace App\Tests\Controller\Api\Auth;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class ProfileControllerTest extends WebTestCase
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

    public function testSuccessfulProfileUpdate(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'firstName' => 'Arnaud-Modifie',
                'lastName' => 'Guevaer-Modifie',
                'email' => 'arnaud.nouveau@famylist.fr',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertTrue($response->headers->contains('content-type', 'application/json'));

        /** @var array{message: string, user: array{id: int, email: string, firstName: string, lastName: string, roles: list<string>, createdAt: string}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('Profil mis à jour avec succès.', $data['message']);
        $this->assertSame('Arnaud-Modifie', $data['user']['firstName']);
        $this->assertSame('Guevaer-Modifie', $data['user']['lastName']);
        $this->assertSame('arnaud.nouveau@famylist.fr', $data['user']['email']);

        // Vérification en base de données
        $this->entityManager->refresh($user);
        $this->assertSame('Arnaud-Modifie', $user->getFirstName());
        $this->assertSame('Guevaer-Modifie', $user->getLastName());
        $this->assertSame('arnaud.nouveau@famylist.fr', $user->getEmail());
    }

    public function testProfileUpdateAllowsKeepingSameEmail(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'firstName' => 'Arnaud-PrenomSeulModifie',
                'lastName' => 'Guevaer',
                'email' => 'arnaud@famylist.fr',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        /** @var array{message: string, user: array{firstName: string, email: string}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Arnaud-PrenomSeulModifie', $data['user']['firstName']);
        $this->assertSame('arnaud@famylist.fr', $data['user']['email']);
    }

    public function testProfileUpdateRejectsDuplicateEmail(): void
    {
        $user1 = $this->createTestUser('arnaud@famylist.fr', 'Password123!');

        // Création d'un second utilisateur
        $user2 = new User();
        $user2->setEmail('existant@famylist.fr');
        $user2->setFirstName('Jean');
        $user2->setLastName('Dupont');
        $user2->setPassword($this->passwordHasher->hashPassword($user2, 'Password123!'));
        $this->entityManager->persist($user2);
        $this->entityManager->flush();

        $this->client->loginUser($user1);

        $this->client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'firstName' => 'Arnaud',
                'lastName' => 'Guevaer',
                'email' => 'existant@famylist.fr',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        /** @var array{message: string, errors: array{email: list<string>}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Cette adresse email est déjà utilisée.', $data['message']);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    public function testProfileUpdateRejectsInvalidData(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'firstName' => 'A', // trop court (< 2)
                'lastName' => '',   // vide
                'email' => 'email-invalide',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        /** @var array{message: string, errors: array<string, list<string>>} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Données non conformes.', $data['message']);
        $this->assertArrayHasKey('firstName', $data['errors']);
        $this->assertArrayHasKey('lastName', $data['errors']);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    public function testProfileUpdateRejectsAnonymousUser(): void
    {
        $this->client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'firstName' => 'Arnaud',
                'lastName' => 'Guevaer',
                'email' => 'arnaud@famylist.fr',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());

        /** @var array{message: string} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Non authentifié.', $data['message']);
    }

    public function testSuccessfulPasswordChange(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'POST',
            '/api/me/password',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'currentPassword' => 'Password123!',
                'newPassword' => 'NewSecurePassword456!',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        /** @var array{message: string} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Mot de passe modifié avec succès.', $data['message']);

        // Vérification en base de données : l'ancien mot de passe ne fonctionne plus, le nouveau est actif
        $this->entityManager->refresh($user);
        $this->assertTrue($this->passwordHasher->isPasswordValid($user, 'NewSecurePassword456!'));
        $this->assertFalse($this->passwordHasher->isPasswordValid($user, 'Password123!'));
    }

    public function testPasswordChangeFailsWithWrongCurrentPassword(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'POST',
            '/api/me/password',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'currentPassword' => 'MauvaisMotDePasseActuel!',
                'newPassword' => 'NewSecurePassword456!',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        /** @var array{message: string, errors: array{currentPassword: list<string>}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Le mot de passe actuel est incorrect.', $data['message']);
        $this->assertArrayHasKey('currentPassword', $data['errors']);
    }

    public function testPasswordChangeFailsWithWeakNewPassword(): void
    {
        $user = $this->createTestUser('arnaud@famylist.fr', 'Password123!');
        $this->client->loginUser($user);

        $this->client->request(
            'POST',
            '/api/me/password',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'currentPassword' => 'Password123!',
                'newPassword' => 'faible',
            ], JSON_THROW_ON_ERROR)
        );

        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $response->getStatusCode());

        /** @var array{message: string, errors: array{newPassword: list<string>}} $data */
        $data = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Données non conformes.', $data['message']);
        $this->assertArrayHasKey('newPassword', $data['errors']);
    }
}
