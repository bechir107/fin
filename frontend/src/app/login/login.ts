import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Service } from '../nut/service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  constructor(
    private service: Service,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Champs de connexion (table `user`) ──────────────────────────────
  email    = '';   // user.email
  password = '';   // user.password

  // ── UI state ─────────────────────────────────────────────────────────
  showPassword  = false;
  rememberMe    = false;
  loading       = false;
  errorMsg      = '';
  successMsg    = '';

  // ── Mot de passe oublié ───────────────────────────────────────────────
  showForgotPwd = false;
  forgotEmail   = '';
  forgotPwdMsg  = '';
  forgotLoading = false;

  features = [
    { label: 'Programme alimentaire personnalisé' },
    { label: "Suivi de l'évolution de votre poids" },
    { label: 'Bilan corporel & objectifs santé' },
    { label: 'Données sécurisées et confidentielles' },
  ];

  // ── Mot de passe oublié ───────────────────────────────────────────────
  closeForgotPwd(): void {
    this.showForgotPwd = false;
    this.forgotEmail   = '';
    this.forgotPwdMsg  = '';
    this.forgotLoading = false;
    this.cdr.detectChanges();
  }

  sendForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.cdr.detectChanges();

    this.service.accesP(this.forgotEmail).subscribe({
      next: (res: any) => {
        this.forgotLoading = false;
        this.forgotPwdMsg  = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.forgotLoading = false;
        this.forgotPwdMsg  = err.error?.message ?? 'Erreur lors de la récupération.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Connexion ─────────────────────────────────────────────────────────
  onSubmit(): void {
    // Validation minimale : seuls email + password sont requis (table `user`)
    if (!this.email || !this.password) {
      this.errorMsg = 'Veuillez saisir votre email et votre mot de passe.';
      this.cdr.detectChanges();
      return;
    }

    this.loading  = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    /*
     * Un seul appel API : le backend reçoit email + password,
     * vérifie dans la table `user`, puis détermine le rôle en
     * cherchant l'id dans `nutritionniste` ou `patient`.
     *
     * Réponse attendue du backend :
     * {
     *   message : 'Connexion réussie',
     *   role    : 'patient' | 'nutritionniste',
     *   user    : { id, nom, prenom, email, ... }
     * }
     */
    this.service.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.message !== 'Connexion réussie') {
          this.errorMsg = 'Réponse inattendue du serveur.';
          this.cdr.detectChanges();
          return;
        }

        // Stocker l'utilisateur courant
        this.service.cuurrentUser = res;

        // Redirection selon le rôle retourné par le backend
        if (res.role === 'nutritionniste') {
          this.successMsg = 'Redirection vers votre tableau de bord...';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['dashboard/rdv']), 1500);
        } else {
          // patient (valeur par défaut)
          this.successMsg = 'Redirection vers votre espace...';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['escpacep/rdvp']), 1500);
        }
      },

      error: (err: any) => {
        this.loading = false;

        if (err.status === 401) {
          // Le backend distingue les deux cas via le message
          this.errorMsg =
            err.error?.message === 'Mot de passe incorrect'
              ? 'Mot de passe incorrect.'
              : 'Email introuvable.';
        } else {
          this.errorMsg = 'Une erreur est survenue. Veuillez réessayer.';
        }

        this.cdr.detectChanges();
      }
    });
  }
}