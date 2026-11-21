<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileDTO
{
    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'Le prénom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $firstName = null;

    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'Le nom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $lastName = null;

    #[Assert\Email(message: "Le format de l'adresse email est invalide.")]
    #[Assert\Length(
        min: 5,
        max: 255,
        minMessage: "L'adresse email doit contenir au moins {{ limit }} caractères.",
        maxMessage: "L'adresse email ne peut pas dépasser {{ limit }} caractères."
    )]
    public ?string $email = null;
}
