<?php

declare(strict_types=1);

namespace App\Controller\Api\Auth;

use App\DTO\ChangePasswordDTO;
use App\Entity\User;
use App\Exception\InvalidCurrentPasswordException;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/me/password', name: 'api_me_change_password', methods: ['POST'])]
class ChangePasswordController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
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

        try {
            $this->userService->changePassword($user, $dto);
        } catch (InvalidCurrentPasswordException $e) {
            return new JsonResponse([
                'message' => $e->getMessage(),
                'errors' => [
                    'currentPassword' => [$e->getMessage()],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return new JsonResponse([
            'message' => 'Mot de passe modifié avec succès.',
        ], Response::HTTP_OK);
    }
}
