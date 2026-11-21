<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ChangePasswordDTO
{
    #[Assert\NotBlank(message: 'Le mot de passe actuel est obligatoire.')]
    public ?string $currentPassword = null;

    #[Assert\NotBlank(message: 'Le nouveau mot de passe est obligatoire.')]
    #[Assert\Length(
        min: 12,
        max: 128,
        minMessage: 'Le nouveau mot de passe doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nouveau mot de passe ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
        message: 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
    )]
    public ?string $newPassword = null;
}
