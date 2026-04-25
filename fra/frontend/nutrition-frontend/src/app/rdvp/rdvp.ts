import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Service } from '../nut/service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rdvp',
  imports: [FormsModule, CommonModule],
  templateUrl: './rdvp.html',
  styleUrl: './rdvp.css',
})
export class Rdvp {
  constructor(private service: Service) { }

  nom = ""
  prenom = ""
  email = ""
  date = ""
  hrdv = ""
  toutesHeures: string[] = []
  heuresPrises: string[] = []
  // ✅ Vérifie si une heure est réservée
  estReservee(h: string): boolean {
    return this.heuresPrises.includes(h);
  }

  chargerHeures() {
    if (!this.date) return;
    console.log('Date choisie:', this.date);

    this.service.getHeures(this.date).subscribe((res: any) => {
      console.log('Réponse complète:', res);
      console.log('Heures disponibles:', res.disponibles);
      console.log('Heures prises:', res.prises);

      this.toutesHeures = res.disponibles;
      this.heuresPrises = res.prises;
      this.hrdv = '';
    });
  }

  prendreRdv() {
    if (!this.nom || !this.prenom || !this.email || !this.date || !this.hrdv) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    this.service.rondv(this.nom, this.prenom, this.email, this.date, this.hrdv)
      .subscribe({
        next: (res) => {
          alert((res as any).message);
          this.nom = "";
          this.prenom = "";
          this.email = "";
          this.date = "";
          this.hrdv = "";
          this.heuresPrises = [];
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la réservation');
        }
      });
  }


}
