import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rdv-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './rdvp.html',
  styleUrls: ['./rdvp.css'],
})
export class Rdvp implements OnInit {
  today: Date = new Date();

  // Form fields
  nom: string = '';
  prenom: string = '';
  email: string = '';
  date_rdv: string = '';
  heure_rdv: string = '';

  // Data
  availableSlots: string[] = [];
  bookedSlots: string[] = [];
  isLoading: boolean = false;
  message: { type: string; text: string } | null = null;

  private apiUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Attempt to pre-fill from localStorage if logged in as patient
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.nom = user.nom || '';
      this.prenom = user.prenom || '';
      this.email = user.email || '';
    }
  }

  onDateChange() {
    if (!this.date_rdv) return;
    
    this.isLoading = true;
    this.heure_rdv = '';
    this.availableSlots = [];
    this.message = null;

    this.http.get<any>(`${this.apiUrl}/heures/${this.date_rdv}`).subscribe({
      next: (res) => {
        const all = res.disponibles || [];
        const prises = res.prises || [];
        // Filter out already booked slots
        this.availableSlots = all.filter((s: string) => !prises.includes(s));
        
        if (this.availableSlots.length === 0) {
          this.message = { type: 'warning', text: 'Aucun créneau disponible pour cette date.' };
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.message = { type: 'error', text: 'Erreur lors de la récupération des horaires.' };
        this.isLoading = false;
      }
    });
  }

  selectSlot(slot: string) {
    this.heure_rdv = slot;
  }

  confirmRDV() {
    if (!this.nom || !this.prenom || !this.email || !this.date_rdv || !this.heure_rdv) {
      this.message = { type: 'error', text: 'Veuillez remplir tous les champs.' };
      return;
    }

    const body = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      date: this.date_rdv,
      hrdv: this.heure_rdv
    };

    this.isLoading = true;
    this.http.post<any>(`${this.apiUrl}/prendrerdv`, body).subscribe({
      next: (res) => {
        this.message = { type: 'success', text: 'Votre rendez-vous a été enregistré avec succès !' };
        this.isLoading = false;
        // Optional: Reset form or navigate
      },
      error: (err) => {
        const msg = err.error?.message || 'Une erreur est survenue.';
        this.message = { type: 'error', text: msg };
        this.isLoading = false;
      }
    });
  }
}
