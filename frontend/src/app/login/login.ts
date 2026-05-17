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
  styleUrls: ['./login.css']
})
export class Login {

  constructor(
    private service: Service,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Champs de connexion ──────────────────────────────────────────────
  email    = '';
  password = '';

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
    if (!this.email || !this.password) {
      this.errorMsg = 'Veuillez saisir votre email et votre mot de passe.';
      this.cdr.detectChanges();
      return;
    }

    this.loading  = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    // ── Admin shortcut ──────────────────────────────────────────────────
    if ((this.email === 'admin' || this.email === 'admin@gmail.com') && this.password === 'admin') {
      this.loading = false;
      const adminUser = { id: 0, nom: 'Admin', prenom: 'Admin', email: this.email, role: 'nutritionniste' };
      this.service.cuurrentUser = adminUser;
      localStorage.setItem('auth_user', JSON.stringify(adminUser));
      localStorage.setItem('auth_token', 'admin_logged_in');

      this.successMsg = 'Connexion admin réussie, redirection...';
      this.cdr.detectChanges();

      // ✅ Délai pour afficher le modal de succès avant la redirection
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
      return;
    }

    // ── Connexion normale ───────────────────────────────────────────────
    this.service.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.message !== 'Connexion réussie') {
          this.errorMsg = 'Réponse inattendue du serveur.';
          this.cdr.detectChanges();
          return;
        }

        // ✅ Stocker AVANT la navigation pour que le guard trouve le token
        this.service.cuurrentUser = res;
        localStorage.setItem('auth_user', JSON.stringify(res));
        localStorage.setItem('auth_token', res.token || 'logged_in');

        // ✅ Afficher le modal de succès
        this.successMsg = 'Connexion réussie ! Redirection vers votre tableau de bord...';
        this.cdr.detectChanges();

        // ✅ Redirection après 1.5s pour laisser le modal s'afficher
        setTimeout(() => {
          // Redirection selon le rôle
          if (res.role === 'nutritionniste') {
            this.router.navigate(['/dashboard/stats']);
          } else if (res.role === 'patient') {
            this.router.navigate(['/espacep/rdvp']);
          } else {
            // Rôle inconnu → dashboard par défaut
            this.router.navigate(['/dashboard/stats']);
          }
        }, 1500);
      },

      error: (err: any) => {
        this.loading = false;

        if (err.status === 401) {
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