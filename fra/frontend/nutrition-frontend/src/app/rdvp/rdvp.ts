import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Service } from '../nut/service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rdvp',
  imports: [FormsModule, CommonModule],
  templateUrl: './rdvp.html',
  styleUrl: './rdvp.css',
})
export class Rdvp {
  @ViewChild('rdvForm') rdvForm!: NgForm; // ← AJOUTER

  constructor(private service: Service) { }

  nom = '';
  prenom = '';
  email = '';
  date = '';
  hrdv = '';
  toutesHeures: string[] = [];
  heuresPrises: string[] = [];

  estReservee(h: string): boolean {
    return this.heuresPrises.includes(h);
  }

  chargerHeures() {
    if (!this.date) return;
    this.service.getHeures(this.date).subscribe((res: any) => {
      this.toutesHeures = res.disponibles;
      this.heuresPrises = res.prises;
      this.hrdv = ''; // reset heure quand date change
    });
  }

  isSubmitting = false;

  prendreRdv() {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    if (this.rdvForm) {
      Object.values(this.rdvForm.controls).forEach(c => c.markAsTouched());
    }

    if (!this.nom || !this.prenom || !this.email || !this.date || !this.hrdv) {
      this.showNotif('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.service.rondv(this.nom, this.prenom, this.email, this.date, this.hrdv)
      .subscribe({
        next: (res) => {
          this.showNotif((res as any).message, 'success');
          // ✅ Reset propre via NgForm (remet l'état pristine/untouched)
          setTimeout(() => {
            this.rdvForm.resetForm({
              nom: 'this.nom',
              prenom: 'this.prenom',
              email: 'this.eamil',
              date: '',
              hrdv: '',
            });
            this.toutesHeures = [];
            this.heuresPrises = [];
          });
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error(err);
          this.showNotif('Erreur lors de la réservation', 'error');
          this.isSubmitting = false;
        }
      });
  }

  notifVisible = false;
  notifMessage = '';
  notifType = 'success';

  showNotif(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.notifMessage = msg;
    this.notifType = type;
    this.notifVisible = true;
    setTimeout(() => this.notifVisible = false, 3000);
  }
}