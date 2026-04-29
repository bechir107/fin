import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface GoogleUser {
  name: string;
  email: string;
  photo: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private router = inject(Router);
  private ngZone = inject(NgZone);
  private http   = inject(HttpClient);

  private readonly CLIENT_ID = '722639722963-42jql8upidibj8rs86ktuobnnfha1pud.apps.googleusercontent.com';
  private readonly USER_KEY  = 'google_user';

  // Initialise le bouton Google sur un élément HTML
  initGoogleSignIn(buttonElementId: string): void {
    if (typeof window === 'undefined' || !(window as any).google) return;

    (window as any).google.accounts.id.initialize({
      client_id: this.CLIENT_ID,
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    (window as any).google.accounts.id.renderButton(
      document.getElementById(buttonElementId),
      { theme: 'outline', size: 'large', text: 'continue_with', locale: 'fr' }
    );
  }

  // Gère la réponse Google (JWT credential)
  private handleCredentialResponse(response: any): void {
    const credential = response.credential;
    const payload    = this.decodeJwt(credential);

    const user: GoogleUser = {
      name:  payload['name'],
      email: payload['email'],
      photo: payload['picture'],
      token: credential,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Retourne dans la zone Angular pour la navigation
    this.ngZone.run(() => {
      this.router.navigate(['/escpacep/rdvp']);
    });
  }

  // Décode un JWT sans librairie externe
  private decodeJwt(token: string): any {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem(this.USER_KEY);
  }

  get user(): GoogleUser | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}