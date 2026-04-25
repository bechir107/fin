import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth/auth.service'; // ← ajouter
import { AfterViewInit, inject } from '@angular/core';



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
  
  loginWithGoogle(): void {
    this.authService.loginWithGoogle(); // ← remplacer l'alert
  }

  user = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  showPassword = false;
  loading      = false;
  errorMsg     = '';
  successMsg   = '';
  ageError     = false;
  termsError   = false;
  maxDate      = new Date().toISOString().split('T')[0];

  // Bloquer la saisie de chiffres dans prénom/nom
  onlyLetters(event: KeyboardEvent): void {
    const allowed = /^[a-zA-ZÀ-ÿ\s\-]$/;
    if (!allowed.test(event.key)) {
      event.preventDefault();
    }
  }
  emailExists = false;
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
    if (this.emailExists) {
  this.errorMsg = 'Cette adresse e-mail est déjà utilisée.';
  return;
}

    // Validation prénom — lettres uniquement
    const lettersOnly = /^[a-zA-ZÀ-ÿ\s\-]+$/;
    if (!this.user.prenom || this.user.prenom.trim().length < 2) {
      this.errorMsg = 'Le prénom est requis (min. 2 caractères).';
      return;
    }
    if (!lettersOnly.test(this.user.prenom)) {
      this.errorMsg = 'Le prénom ne doit contenir que des lettres.';
      return;
    }

    // Validation nom — lettres uniquement
    if (!this.user.nom || this.user.nom.trim().length < 2) {
      this.errorMsg = 'Le nom est requis (min. 2 caractères).';
      return;
    }
    if (!lettersOnly.test(this.user.nom)) {
      this.errorMsg = 'Le nom ne doit contenir que des lettres.';
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.user.email || !emailRegex.test(this.user.email)) {
      this.errorMsg = 'Adresse e-mail invalide.';
      return;
    }

    // Validation téléphone
    const telRegex = /^[0-9+\s]{8,15}$/;
    if (!this.user.telephone || !telRegex.test(this.user.telephone)) {
      this.errorMsg = 'Numéro de téléphone invalide (8-15 chiffres).';
      return;
    }
    

    // Validation date de naissance
    if (!this.user.dateNaissance) {
      this.errorMsg = 'La date de naissance est requise.';
      return;
    }
    const birth = new Date(this.user.dateNaissance);
    const age   = new Date().getFullYear() - birth.getFullYear();
    if (age < 5) {
      this.ageError = true;
      return;
    }

    // Validation mot de passe
    if (!this.user.password || this.user.password.length < 6) {
      this.errorMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    // Confirmation mot de passe
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }

    // CGU
    if (!this.user.acceptTerms) {
      this.termsError = true;
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const payload = {
      prenom:         this.user.prenom.trim(),
      nom:            this.user.nom.trim(),
      email:          this.user.email.trim(),
      telephone:      this.user.telephone.trim(),
      date_naissance: this.user.dateNaissance,
      mot_de_passe:   this.user.password
    };

    this.http.post(`${this.api}/createPatient`, payload).subscribe({
  next: () => {
    this.loading    = false;
    this.successMsg = 'Votre compte a été créé avec succès. Bienvenue !';
    this.cdr.detectChanges();
    setTimeout(() => this.router.navigate(['/escpacep/rdvp']), 2000);
  },
  error: (err: any) => {
    this.loading = false;
    if (err.status === 409) {
      this.errorMsg = 'Cette adresse e-mail est déjà utilisée. Veuillez vous connecter.';
    } else if (err.status === 400) {
      this.errorMsg = 'Champs obligatoires manquants. Vérifiez le formulaire.';
    } else {
      this.errorMsg = err.error?.message ?? 'Une erreur est survenue. Réessayez.';
    }
    this.cdr.detectChanges();
  }
});
}}