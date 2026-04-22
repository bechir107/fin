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

  constructor(private service: Service, private router: Router, private cdr: ChangeDetectorRef) {}

  showPassword = false;
  rememberMe   = false;
  loading      = false;
  errorMsg     = '';
  successMsg   = '';
  email        = '';
  password     = '';
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


  closeForgotPwd(): void {
    this.showForgotPwd = false;
    this.forgotEmail = '';
    this.forgotPwdMsg = '';
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
        this.forgotPwdMsg = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.forgotLoading = false;
        this.forgotPwdMsg = err.error?.message ?? 'Erreur lors de la récupération.';
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading  = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    // Tentative connexion patient
    this.service.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.message === 'Connexion réussie') {
          this.service.cuurrentUser = res;
          this.successMsg = 'Redirection vers votre espace...';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['escpacep/rdvp']);
          }, 1500);
        } else {
            this.cdr.detectChanges();
        }
      },
      error: (errPatient: any) => {
        if (errPatient.status === 401 && errPatient.error?.message === 'Mot de passe incorrect') {
          this.errorMsg = 'Mot de passe incorrect';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Échec patient (Email introuvable) → tentative nutritionniste
        this.service.loginNut(this.email, this.password).subscribe({
          next: (res: any) => {
            this.loading = false;
            if (res.message === 'Connexion réussie') {
              this.successMsg = 'Redirection vers le tableau de bord...';
              this.cdr.detectChanges();
              setTimeout(() => {
                this.router.navigate(['dashboard/rdv']);
              }, 1500);
            } else {
                this.cdr.detectChanges();
            }
          },
          error: (errNut: any) => {
            if (errNut.status === 401 && errNut.error?.message === 'Mot de passe incorrect') {
                this.errorMsg = 'Mot de passe incorrect';
            } else {
                this.errorMsg = 'Email introuvable';
            }
            this.loading  = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}