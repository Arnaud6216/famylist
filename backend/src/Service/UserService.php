<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\ChangePasswordDTO;
use App\DTO\UpdateProfileDTO;
use App\Entity\User;
use App\Exception\EmailAlreadyUsedException;
use App\Exception\InvalidCurrentPasswordException;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * Met à jour les informations du profil utilisateur.
     *
     * @throws EmailAlreadyUsedException Si l'email est déjà utilisé par un autre compte
     */
    public function updateProfile(User $user, UpdateProfileDTO $dto): User
    {
        $newEmail = (string) $dto->email;
        if (strtolower($newEmail) !== strtolower($user->getEmail())) {
            $existingUser = $this->userRepository->findOneBy(['email' => $newEmail]);
            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                throw new EmailAlreadyUsedException('Cette adresse email est déjà utilisée.');
            }
        }

        $user->setFirstName((string) $dto->firstName);
        $user->setLastName((string) $dto->lastName);
        $user->setEmail($newEmail);

        $this->entityManager->flush();

        return $user;
    }

    /**
     * Met à jour de manière sécurisée le mot de passe utilisateur.
     *
     * @throws InvalidCurrentPasswordException Si le mot de passe actuel est erroné
     */
    public function changePassword(User $user, ChangePasswordDTO $dto): void
    {
        if (!$this->passwordHasher->isPasswordValid($user, (string) $dto->currentPassword)) {
            throw new InvalidCurrentPasswordException('Le mot de passe actuel est incorrect.');
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, (string) $dto->newPassword);
        $user->setPassword($hashedPassword);

        $this->entityManager->flush();
    }
}
