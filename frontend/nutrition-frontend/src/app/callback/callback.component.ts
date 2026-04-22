import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  standalone: true,
  template: `<p>Connexion en cours...</p>`
})
export class CallbackComponent implements OnInit {
  constructor(private oauthService: OAuthService, private router: Router) {}

  ngOnInit() {
    // Le token est déjà traité par loadDiscoveryDocumentAndTryLogin()
    // Redirige vers la page principale
    this.router.navigate(['/home']);
  }
}