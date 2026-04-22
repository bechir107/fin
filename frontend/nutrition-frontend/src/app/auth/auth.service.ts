import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { authConfig } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private oauthService = inject(OAuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  constructor() {
    const origin = this.document.location.origin;

    this.oauthService.configure({
      ...authConfig,
      redirectUri: origin + '/callback',
    });

    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.isLoggedIn) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loginWithGoogle() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  get user() {
    const claims = this.oauthService.getIdentityClaims() as any;
    return {
      name: claims?.['name'],
      email: claims?.['email'],
      photo: claims?.['picture'],
    };
  }
}