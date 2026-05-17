import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface TimeSlot {
  start: string;
  end: string;
}

interface Settings {
  onlineBooking: boolean;
  reminders: boolean;
  onlineCancel: boolean;
}

@Component({
  selector: 'app-disponibilite',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disponibilite.html',
  styleUrls: ['./disponibilite.css'],
})
export class Disponibilite implements OnInit {

  private readonly API = 'http://127.0.0.1:5000';

  /** Émis après une sauvegarde réussie ou en erreur */
  @Output() saved = new EventEmitter<{ success: boolean; message: string }>();

  // ── State ─────────────────────────────────────────────────────────────────
  dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

  availability: TimeSlot[][] = Array.from({ length: 7 }, () => [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ]);

  settings: Settings = {
    onlineBooking: true,
    reminders: true,
    onlineCancel: false,
  };

  // ────────────────────────────────────────────────────────────────────────
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAvailability();
  }

  // ── API ───────────────────────────────────────────────────────────────────
  loadAvailability(): void {
    this.http.get<any[]>(`${this.API}/disponibilite`).subscribe({
      next: (res) => {
        this.availability = Array.from({ length: 7 }, () => []);
        res.forEach(item => {
          const dayIdx = this.dayNames.indexOf(item.jour);
          if (dayIdx !== -1) {
            this.availability[dayIdx].push({ start: item.heure_debut, end: item.heure_fin });
          }
        });
      },
      error: (err) => console.error('Erreur chargement dispos:', err),
    });
  }

  save(): void {
    const payload: any[] = [];
    this.availability.forEach((daySlots, dayIdx) => {
      daySlots.forEach(slot => {
        payload.push({
          jour: this.dayNames[dayIdx],
          heure_debut: slot.start,
          heure_fin: slot.end,
        });
      });
    });

    this.http.post(`${this.API}/disponibilite`, payload).subscribe({
      next: () => this.saved.emit({ success: true,  message: 'Disponibilités sauvegardées' }),
      error: ()  => this.saved.emit({ success: false, message: 'Erreur lors de la sauvegarde' }),
    });
  }

  // ── Slot management ───────────────────────────────────────────────────────
  addSlot(dayIdx: number): void {
    this.availability[dayIdx].push({ start: '09:00', end: '10:00' });
  }

  removeSlot(dayIdx: number, slotIdx: number): void {
    this.availability[dayIdx].splice(slotIdx, 1);
  }
}