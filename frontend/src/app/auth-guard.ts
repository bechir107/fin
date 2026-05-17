import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // On vérifie directement la clé que tu as sauvegardée dans ton login.ts
  const token = localStorage.getItem('auth_token');

  if (token) {
    return true; // L'utilisateur a un token, on le laisse passer
  }

  // Pas de token -> redirection vers le login
  router.navigate(['/login']);
  return false;
};