<?php

declare(strict_types=1);

namespace App\Controller\Api\Auth;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;

class SecurityController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): never
    {
        // Ce contrôleur est intercepté automatiquement par le firewall json_login dans security.yaml
        throw new \LogicException('Cette méthode est interceptée automatiquement par le firewall Symfony.');
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        // Ce contrôleur est intercepté automatiquement par le firewall logout dans security.yaml
        throw new \LogicException('Cette méthode est interceptée automatiquement par le firewall Symfony.');
    }
}
