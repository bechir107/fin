import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { authConfig } from '../auth/auth.config';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex; justify-content:center; align-items:center; 
                height:100vh; flex-direction:column; gap:16px;">
      <p>Connexion en cours...</p>
      <span *ngIf="error" style="color:red;">{{ error }}</span>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  private oauthService = inject(OAuthService);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);

  error = '';

  async ngOnInit() {
    try {
      this.oauthService.configure(authConfig);
      await this.oauthService.loadDiscoveryDocument();

      // Avec implicit flow, tryLogin() suffit — pas besoin de tryLoginCodeFlow()
      await this.oauthService.tryLogin();

      if (this.oauthService.hasValidAccessToken()) {
        this.router.navigate(['/escpacep/rdvp']);
      } else {
        this.error = 'Échec de la connexion. Réessayez.';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      this.error = 'Erreur lors de la connexion Google.';
      this.cdr.detectChanges();
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}