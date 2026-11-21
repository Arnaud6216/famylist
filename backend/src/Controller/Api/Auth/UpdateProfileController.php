<?php

declare(strict_types=1);

namespace App\Controller\Api\Auth;

use App\DTO\UpdateProfileDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/me', name: 'api_me_update', methods: ['PATCH', 'PUT'])]
class UpdateProfileController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
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
            /** @var UpdateProfileDTO $dto */
            $dto = $this->serializer->deserialize($content, UpdateProfileDTO::class, 'json');
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

        $newEmail = (string) $dto->email;
        if (strtolower($newEmail) !== strtolower($user->getEmail())) {
            $existingUser = $this->userRepository->findOneBy(['email' => $newEmail]);
            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return new JsonResponse([
                    'message' => 'Cette adresse email est déjà utilisée.',
                    'errors' => [
                        'email' => ['Cette adresse email est déjà utilisée.'],
                    ],
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $user->setFirstName((string) $dto->firstName);
        $user->setLastName((string) $dto->lastName);
        $user->setEmail($newEmail);

        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Profil mis à jour avec succès.',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'roles' => $user->getRoles(),
                'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ],
        ], Response::HTTP_OK);
    }
}
