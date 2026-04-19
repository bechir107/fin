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
  constructor(private service: Service) {}

  nom = ""
  prenom = ""
  email = ""
  date = ""
  hrdv = ""
  heuresPrises: string[] = []

  // ✅ Liste des heures de ton ENUM
  toutesHeures = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00']

  // ✅ Vérifie si une heure est réservée
  estReservee(h: string): boolean {
    return this.heuresPrises.includes(h);
  }

  
  chargerHeures() {
    if (!this.date) return;
    this.service.getHeures(this.date).subscribe((res: any) => {
      this.heuresPrises = res;
      this.hrdv = ""; // reset heure si date change
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