<?php

namespace App\Controller\Api\Auth;

use App\DTO\RegisterUserDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/register', name: 'api_register', methods: ['POST'])]
class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $content = $request->getContent();
        if (empty($content)) {
            return new JsonResponse([
                'message' => 'Corps de la requête vide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            /** @var RegisterUserDTO $dto */
            $dto = $this->serializer->deserialize($content, RegisterUserDTO::class, 'json');
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

        if (null !== $dto->email && null !== $this->userRepository->findOneBy(['email' => $dto->email])) {
            return new JsonResponse([
                'message' => 'Cette adresse email est déjà utilisée.',
                'errors' => [
                    'email' => ['Cette adresse email est déjà utilisée.'],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = new User();
        $user->setEmail((string) $dto->email);
        $user->setFirstName((string) $dto->firstName);
        $user->setLastName((string) $dto->lastName);

        $hashedPassword = $this->passwordHasher->hashPassword($user, (string) $dto->password);
        $user->setPassword($hashedPassword);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Inscription réussie.',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ],
        ], Response::HTTP_CREATED);
    }
}
