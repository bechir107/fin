import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Service } from '../nut/service';

@Component({
  selector: 'app-ajouterpatient',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ajouterpatient.html',
  styleUrls: ['./ajouterpatient.css'],
})
export class AjouterPatient {
  nom       = '';
  prenom    = '';
  email     = '';
  telephone = '';

  loading  = false;
  success  = false;
  erreur   = '';
  motDePasseTemp = '';

  constructor(private svc: Service, private router: Router) {}

  valider(): void {
    this.erreur  = '';
    this.success = false;

    if (!this.nom.trim() || !this.prenom.trim()) {
      this.erreur = 'Le nom et le prénom sont obligatoires.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email.trim() || !emailRegex.test(this.email.trim())) {
      this.erreur = 'Veuillez saisir une adresse email valide.';
      return;
    }
    const telRegex = /^[0-9\s+\-]{8,15}$/;
    if (this.telephone.trim() && !telRegex.test(this.telephone.trim())) {
      this.erreur = 'Numéro de téléphone invalide (8 à 15 chiffres).';
      return;
    }

    this.loading = true;
    this.svc.ajouterPatientSimple(
      this.nom.trim(),
      this.prenom.trim(),
      this.email.trim(),
      this.telephone.trim()
    ).subscribe({
      next: (res: any) => {
        this.loading       = false;
        this.success       = true;
        this.motDePasseTemp = res.mot_de_passe_temp || '';
        this.resetForm();
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 409) {
          this.erreur = 'Cette adresse email est déjà utilisée.';
        } else {
          this.erreur = err.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  retour(): void {
    this.router.navigate(['/dashboard/patient']);
  }

  ajouterAutre(): void {
    this.success       = false;
    this.motDePasseTemp = '';
  }

  private resetForm(): void {
    this.nom       = '';
    this.prenom    = '';
    this.email     = '';
    this.telephone = '';
  }
}
