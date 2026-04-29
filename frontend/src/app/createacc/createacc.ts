import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-createacc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './createacc.html',
  styleUrls: ['./createacc.css']
})
export class Createacc {

  private api = 'http://127.0.0.1:5000';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  user = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ddn: '',           // date de naissance → champ `ddn` dans `user`
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    // Champs spécifiques patient
    sexe: '',
    adresse: '',
    taille: null as number | null,
    allergie: '',
    maladie_chronique: '',
    objectif: '',
    ddc: ''            // date début consultation
  };

  showPassword = false;
  loading      = false;
  errorMsg     = '';
  successMsg   = '';
  ageError     = false;
  termsError   = false;
  maxDate      = new Date().toISOString().split('T')[0];

  onlyLetters(event: KeyboardEvent): void {
    const allowed = /^[a-zA-ZÀ-ÿ\s\-]$/;
    if (!allowed.test(event.key)) event.preventDefault();
  }

  emailExists   = false;
  checkingEmail = false;

  checkEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.user.email || !emailRegex.test(this.user.email)) return;

    this.checkingEmail = true;
    this.emailExists   = false;
    this.cdr.detectChanges();

    this.http.get(`${this.api}/checkEmail/${this.user.email}`).subscribe({
      next: (res: any) => {
        this.checkingEmail = false;
        this.emailExists   = res.exists;
        this.cdr.detectChanges();
      },
      error: () => {
        this.checkingEmail = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.errorMsg  = '';
    this.ageError  = false;
    this.termsError = false;

    if (this.emailExists) {
      this.errorMsg = 'Cette adresse e-mail est déjà utilisée.';
      return;
    }

    const lettersOnly = /^[a-zA-ZÀ-ÿ\s\-]+$/;

    if (!this.user.prenom || this.user.prenom.trim().length < 2) {
      this.errorMsg = 'Le prénom est requis (min. 2 caractères).'; return;
    }
    if (!lettersOnly.test(this.user.prenom)) {
      this.errorMsg = 'Le prénom ne doit contenir que des lettres.'; return;
    }
    if (!this.user.nom || this.user.nom.trim().length < 2) {
      this.errorMsg = 'Le nom est requis (min. 2 caractères).'; return;
    }
    if (!lettersOnly.test(this.user.nom)) {
      this.errorMsg = 'Le nom ne doit contenir que des lettres.'; return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.user.email || !emailRegex.test(this.user.email)) {
      this.errorMsg = 'Adresse e-mail invalide.'; return;
    }

    const telRegex = /^[0-9+\s]{8,15}$/;
    if (!this.user.telephone || !telRegex.test(this.user.telephone)) {
      this.errorMsg = 'Numéro de téléphone invalide (8-15 chiffres).'; return;
    }

    if (!this.user.ddn) {
      this.errorMsg = 'La date de naissance est requise.'; return;
    }
    const birth = new Date(this.user.ddn);
    const age   = new Date().getFullYear() - birth.getFullYear();
    if (age < 5) { this.ageError = true; return; }

    if (!this.user.password || this.user.password.length < 6) {
      this.errorMsg = 'Le mot de passe doit contenir au moins 6 caractères.'; return;
    }
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.'; return;
    }
    if (!this.user.acceptTerms) { this.termsError = true; return; }

    this.loading = true;
    this.cdr.detectChanges();

    // Payload aligné sur /createPatient du nouveau app.py
    const payload = {
      nom:               this.user.nom.trim(),
      prenom:            this.user.prenom.trim(),
      ddn:               this.user.ddn,          // date de naissance → table user
      email:             this.user.email.trim(),
      password:          this.user.password,
      telephone:         this.user.telephone.trim(),
      sexe:              this.user.sexe,
      adresse:           this.user.adresse,
      taille:            this.user.taille,
      allergie:          this.user.allergie,
      maladie_chronique: this.user.maladie_chronique,
      objectif:          this.user.objectif,
      ddc:               this.user.ddc           // date début consultation → table patient
    };

    this.http.post(`${this.api}/createUser`, payload).subscribe({
      next: () => {
        this.loading    = false;
        this.successMsg = 'Votre compte a été créé avec succès. Bienvenue !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/escpacep/rdvp']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMsg = 'Cette adresse e-mail est déjà utilisée.';
        } else if (err.status === 400) {
          this.errorMsg = 'Champs obligatoires manquants. Vérifiez le formulaire.';
        } else {
          this.errorMsg = err.error?.message ?? 'Une erreur est survenue. Réessayez.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}