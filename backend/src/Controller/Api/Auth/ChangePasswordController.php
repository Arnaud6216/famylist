<?php

declare(strict_types=1);

namespace App\Controller\Api\Auth;

use App\DTO\ChangePasswordDTO;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/me/password', name: 'api_me_change_password', methods: ['POST'])]
class ChangePasswordController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    public function __invoke(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return new JsonResponse([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $content = $request->getContent();
        if (empty($content)) {
            return new JsonResponse([
                'message' => 'Corps de la requête vide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            /** @var ChangePasswordDTO $dto */
            $dto = $this->serializer->deserialize($content, ChangePasswordDTO::class, 'json');
        } catch (\Throwable) {
            return new JsonResponse([
                'message' => 'Format JSON invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[$violation->getPropertyPath()][] = $violation->getMessage();
            }

            return new JsonResponse([
                'message' => 'Données non conformes.',
                'errors' => $errors,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Vérification du mot de passe actuel
        if (!$this->passwordHasher->isPasswordValid($user, (string) $dto->currentPassword)) {
            return new JsonResponse([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => [
                    'currentPassword' => ['Le mot de passe actuel est incorrect.'],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Hachage et mise à jour du nouveau mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword($user, (string) $dto->newPassword);
        $user->setPassword($hashedPassword);

        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Mot de passe modifié avec succès.',
        ], Response::HTTP_OK);
    }
}
