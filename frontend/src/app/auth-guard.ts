import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  if (authService.isLoggedIn) {
    return true;
  }

  // Sinon redirection vers login
  router.navigate(['/login']);
  return false;

};