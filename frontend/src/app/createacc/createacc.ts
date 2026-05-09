import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Service } from '../nut/service';

@Component({
  selector: 'app-createacc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './createacc.html',
  styleUrls: ['./createacc.css']
})
export class Createacc implements OnInit {
  step = 1;
  totalSteps = 2;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isEditing = false;

  form: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private service: Service) {
    this.form = this.fb.group({
      // Step 1 — User
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      ddn: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\s\-]{8,15}$/)]],

      // Step 2 — Patient
      sexe: ['', Validators.required],
      adresse: ['', Validators.required],
      taille: ['', [Validators.required, Validators.min(50), Validators.max(250)]],
      allergie: [''],
      maladie_chronique: [''],
      objectif: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Vérifier si l'utilisateur est connecté (dans localStorage)
    const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('google_user');
    if (!userDataStr) return; // Pas d'utilisateur connecté

    try {
      const userData = JSON.parse(userDataStr);
      const email = userData.email;

      if (email) {
        this.isEditing = true;
        // Charger les données depuis le serveur
        this.service.getUserProfile(email).subscribe({
          next: (profile: any) => {
            this.form.patchValue({
              nom: profile.nom || '',
              prenom: profile.prenom || '',
              ddn: profile.ddn || '',
              email: profile.email || '',
              telephone: profile.telephone || '',
              sexe: profile.sexe || '',
              adresse: profile.adresse || '',
              taille: profile.taille || '',
              allergie: profile.allergie || '',
              maladie_chronique: profile.maladie_chronique || '',
              objectif: profile.objectif || '',
            });
            // Si mode édition, ne pas exiger le mot de passe
            this.form.get('password')?.clearAsyncValidators();
          },
          error: (err) => {
            console.error('Erreur chargement profil:', err);
          }
        });
      }
    } catch (e) {
      console.error('Erreur parsing userData:', e);
    }
  }

  get f() { return this.form.controls; }

  nextStep() {
    const step1Fields = this.isEditing
      ? ['nom', 'prenom', 'ddn', 'email', 'telephone']
      : ['nom', 'prenom', 'ddn', 'email', 'password', 'telephone'];
    step1Fields.forEach(field => this.form.get(field)?.markAsTouched());
    const step1Valid = step1Fields.every(field => this.form.get(field)?.valid);
    if (step1Valid) this.step = 2;
  }

  prevStep() {
    this.step = 1;
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const endpoint = this.isEditing 
      ? 'http://localhost:5000/updateProfile' 
      : 'http://localhost:5000/api/register';

    this.http.post(endpoint, this.form.value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = this.isEditing 
          ? 'Profil mis à jour avec succès !'
          : 'Compte créé avec succès !';
        setTimeout(() => {
          if (this.isEditing) {
            this.router.navigate(['/dashboard/rdv']);
          } else {
            this.router.navigate(['/login']);
          }
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}