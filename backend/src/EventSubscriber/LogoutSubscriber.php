<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

class LogoutSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            LogoutEvent::class => 'onLogout',
        ];
    }

    public function onLogout(LogoutEvent $event): void
    {
        $request = $event->getRequest();

        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }

        if (str_starts_with($request->getPathInfo(), '/api/')) {
            $response = new JsonResponse([
                'message' => 'Déconnexion réussie.',
            ], Response::HTTP_OK);

            // Invalider le cookie de session PHPSESSID côté client en respectant le protocole (Secure en HTTPS)
            $response->headers->clearCookie('PHPSESSID', '/', null, $request->isSecure(), true, 'lax');

            $event->setResponse($response);
        }
    }
}
