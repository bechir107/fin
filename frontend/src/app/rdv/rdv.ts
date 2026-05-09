import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// ── Types ──────────────────────────────────────────────────────────────────
export interface Appointment {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  date_rdv: string;   // ISO: "2026-05-04"
  hrdv: string;       // "09:00"
  statut: 'pending' | 'confirmed' | 'cancelled';
  source?: 'online' | 'phone';
}

interface CalendarCell {
  day: number | null;
  dateStr: string | null;
  otherMonth: boolean;
  isToday: boolean;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface Settings {
  onlineBooking: boolean;
  reminders: boolean;
  onlineCancel: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-rdv',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './rdv.html',
  styleUrls: ['./rdv.css'],
})
export class Rdv implements OnInit, AfterViewInit {


  // ── Nav ──────────────────────────────────────────────────────────────────
  activeSection: 'calendar' | 'appointments' | 'availability' = 'calendar';

  // ── Data ─────────────────────────────────────────────────────────────────
  /** Rendez-vous d'aujourd'hui */
  data: Appointment[] = [];
  /** Tous les rendez-vous */
  allPatients: Appointment[] = [];
  /** Liste filtrée pour la section Rendez-vous */
  filteredAppointments: Appointment[] = [];

  // ── Filters ──────────────────────────────────────────────────────────────
  statusFilter: 'all' | 'pending' | 'confirmed' | 'cancelled' = 'all';
  searchQuery = '';

  // ── KPIs ─────────────────────────────────────────────────────────────────
  get weekCount():    number { return this.allPatients.filter(a => this.isThisWeek(a.date_rdv)).length; }
  get onlineCount():  number { return this.allPatients.filter(a => a.source === 'online').length; }
  get phoneCount():   number { return this.allPatients.filter(a => a.source === 'phone').length; }
  get pendingCount(): number { return this.allPatients.filter(a => a.statut === 'pending').length; }

  // ── Calendar ─────────────────────────────────────────────────────────────
  currentYear  = new Date().getFullYear();
  currentMonth = new Date().getMonth();   // 0-indexed
  selectedDate: string | null = null;

  calendarCells: CalendarCell[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  get currentMonthLabel(): string {
    return new Date(this.currentYear, this.currentMonth, 1)
      .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '';
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  // ── Time slots ───────────────────────────────────────────────────────────
  timeSlots: string[] = []; // Will be generated dynamically

  // ── Availability ─────────────────────────────────────────────────────────
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

  // ── Phone modal ──────────────────────────────────────────────────────────
  showPhoneModal = false;
  isSubmitting   = false;
  nom    = '';
  prenom = '';
  email:  string = '';
  telephone: string = '';
  date:   string = '';
  heure  = '';
  phoneAvailableSlots: string[] = [];

  // ── Details modal ─────────────────────────────────────────────────────────
  showDetailsModal    = false;
  selectedAppointment: Appointment | null = null;

  // ── Notification ──────────────────────────────────────────────────────────
  notifVisible = false;
  notifMessage = '';
  notifType: 'success' | 'warning' | 'error' = 'success';
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  // ── API URL ───────────────────────────────────────────────────────────────
  private readonly API = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  // ────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.generateTimeSlots();
    this.buildCalendar();
    this.afficher();
    this.loadAvailability();
  }

  generateTimeSlots() {
    const slots = [];
    let current = 8 * 60; // 08:00 in minutes
    const end = 19 * 60;   // 19:00 in minutes
    
    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      current += 45; // 45 minutes interval
    }
    this.timeSlots = slots;
  }

  ngAfterViewInit(): void {
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  /** Charge tous les RDV + RDV d'aujourd'hui */
  afficher(): void {
    const todayStr = this.toDateStr(new Date());

    this.http.get<{rendez_vous: any[]}>(`${this.API}/rendez_vous`).subscribe({
      next: (response) => {
        const mappedAppointments: Appointment[] = response.rendez_vous.map((r: any) => ({
          id: r.id_rendez_vous,
          nom: r.nom,
          prenom: r.prenom,
          email: r.email,
          date_rdv: r.date_rendez_vous,
          hrdv: r.heure,
          statut: r.statut === 'en_attente' ? 'pending' : (r.statut === 'confirme' ? 'confirmed' : 'cancelled'),
          source: 'online'
        }));
        this.allPatients = mappedAppointments;
        this.data        = mappedAppointments.filter(a => a.date_rdv === todayStr);
        this.filterAppointments();
      },
      error: () => {
        // Données mock en cas d'absence d'API
        this.allPatients = this.getMockData();
        this.data        = this.allPatients.filter(a => a.date_rdv === todayStr);
        this.filterAppointments();
      },
    });
  }

  confirmAppointment(id: number): void {
    this.http.put(`${this.API}/rdv/${id}/statut`, { statut: 'confirme' }).subscribe({
      next: () => {
        this.updateLocalStatus(id, 'confirmed');
        this.showNotif('Rendez-vous confirmé', 'success');
      },
      error: () => {
        this.updateLocalStatus(id, 'confirmed');
        this.showNotif('Rendez-vous confirmé (mode hors-ligne)', 'success');
      },
    });
  }

  cancelAppointment(id: number): void {
    this.http.put(`${this.API}/rdv/${id}/statut`, { statut: 'annule' }).subscribe({
      next: () => {
        this.updateLocalStatus(id, 'cancelled');
        this.showNotif('Rendez-vous annulé', 'warning');
      },
      error: () => {
        this.updateLocalStatus(id, 'cancelled');
        this.showNotif('Rendez-vous annulé (mode hors-ligne)', 'warning');
      },
    });
  }

  rdv(): void {
    if (!this.nom || !this.prenom || !this.date || !this.heure) {
      this.showNotif('Veuillez remplir tous les champs requis', 'error');
      return;
    }
    this.isSubmitting = true;

    const payload = {
      nom:      `${this.nom} ${this.prenom}`,
      telephone: this.telephone,
      date_rendez_vous: this.date,
      heure:     this.heure,
      id_nutritionniste: 1, // Default to 1
      statut:   'en_attente'
    };

    this.http.post(`${this.API}/rdv_tel`, payload).subscribe({
      next: (created) => {
        this.allPatients.push(created);
        this.data.push(created);
        this.filterAppointments();
        this.resetPhoneForm();
        this.showPhoneModal = false;
        this.showNotif('Rendez-vous ajouté avec succès', 'success');
      },
      error: () => {
        // Mode hors-ligne : créer localement
        const mock: Appointment = { ...payload, id: Date.now() };
        this.allPatients.push(mock);
        this.data.push(mock);
        this.filterAppointments();
        this.resetPhoneForm();
        this.showPhoneModal = false;
        this.showNotif('Rendez-vous ajouté (mode hors-ligne)', 'success');
      },
    });
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  setFilter(f: typeof this.statusFilter): void {
    this.statusFilter = f;
    this.filterAppointments();
  }

  filterAppointments(): void {
    let list = [...this.allPatients];

    if (this.statusFilter !== 'all') {
      list = list.filter(a => a.statut === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        a.nom.toLowerCase().includes(q) ||
        a.prenom.toLowerCase().includes(q) ||
        (a.email?.toLowerCase().includes(q) ?? false),
      );
    }

    this.filteredAppointments = list;
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  buildCalendar(): void {
    const today     = new Date();
    const firstDay  = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay   = new Date(this.currentYear, this.currentMonth + 1, 0);

    // lundi = 0 pour décalage
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: CalendarCell[] = [];

    // Jours du mois précédent
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth, -i);
      cells.push({ day: d.getDate(), dateStr: null, otherMonth: true, isToday: false });
    }

    // Jours du mois courant
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(this.currentYear, this.currentMonth, d);
      cells.push({
        day:        d,
        dateStr:    this.toDateStr(dt),
        otherMonth: false,
        isToday:    this.toDateStr(dt) === this.toDateStr(today),
      });
    }

    // Compléter jusqu'à 42 cellules (6 semaines)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, dateStr: null, otherMonth: true, isToday: false });
    }

    this.calendarCells = cells;
  }

  changeMonth(delta: number): void {
    this.currentMonth += delta;
    if (this.currentMonth < 0)  { this.currentMonth = 11; this.currentYear--; }
    if (this.currentMonth > 11) { this.currentMonth = 0;  this.currentYear++; }
    this.buildCalendar();
    this.selectedDate = null;
  }

  selectDate(dateStr: string): void {
    this.selectedDate = dateStr;
  }

  // ── Slot helpers ──────────────────────────────────────────────────────────

  getBooked(dateStr: string):    number {
    return this.allPatients.filter(a => a.date_rdv === dateStr && a.statut === 'confirmed').length;
  }
  getPending(dateStr: string):   number {
    return this.allPatients.filter(a => a.date_rdv === dateStr && a.statut === 'pending').length;
  }
  getAvailable(dateStr: string): number {
    const dow   = (new Date(dateStr).getDay() + 6) % 7; // lundi=0
    const slots = this.getGeneratedSlots(dateStr);
    return slots.filter(s => !this.isBooked(dateStr, s)).length;
  }

  isBooked(dateStr: string, slot: string): boolean {
    return this.allPatients.some(
      a => a.date_rdv === dateStr && a.hrdv === slot && a.statut !== 'cancelled',
    );
  }

  isAvailableSlot(dateStr: string, slot: string): boolean {
    const dow   = (new Date(dateStr).getDay() + 6) % 7;
    const avail = this.availability[dow] || [];
    return avail.some(range => slot >= range.start && slot < range.end);
  }

  getSlotTitle(dateStr: string, slot: string): string {
    if (this.isBooked(dateStr, slot)) {
      const apt = this.allPatients.find(
        a => a.date_rdv === dateStr && a.hrdv === slot && a.statut !== 'cancelled',
      );
      return apt ? `${apt.nom} ${apt.prenom}` : 'Occupé';
    }
    return this.isAvailableSlot(dateStr, slot) ? 'Disponible' : 'Hors plage';
  }

  onSlotClick(dateStr: string, slot: string): void {
    if (!this.isBooked(dateStr, slot) && this.isAvailableSlot(dateStr, slot)) {
      this.date  = dateStr;
      this.heure = slot;
      this.openPhoneModal();
    }
  }

  // ── Availability ──────────────────────────────────────────────────────────

  addSlot(dayIdx: number): void {
    this.availability[dayIdx].push({ start: '09:00', end: '10:00' });
  }

  removeSlot(dayIdx: number, slotIdx: number): void {
    this.availability[dayIdx].splice(slotIdx, 1);
  }

  loadAvailability(): void {
    this.http.get<any[]>(`${this.API}/disponibilite`).subscribe({
      next: (res) => {
        // Reset availability first
        this.availability = Array.from({ length: 7 }, () => []);
        
        res.forEach(item => {
          const dayIdx = this.dayNames.indexOf(item.jour);
          if (dayIdx !== -1) {
            this.availability[dayIdx].push({
              start: item.heure_debut,
              end: item.heure_fin
            });
          }
        });
      },
      error: (err) => console.error('Erreur chargement dispos:', err)
    });
  }

  saveAvailability(): void {
    const payload: any[] = [];
    this.availability.forEach((daySlots, dayIdx) => {
      daySlots.forEach(slot => {
        payload.push({
          jour: this.dayNames[dayIdx],
          heure_debut: slot.start,
          heure_fin: slot.end
        });
      });
    });

    this.http.post(`${this.API}/disponibilite`, payload).subscribe({
      next: () => {
        this.showNotif('Disponibilités sauvegardées dans la base de données', 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde dispos:', err);
        this.showNotif('Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  // ── Phone modal ───────────────────────────────────────────────────────────

  openPhoneModal(): void {
    if (!this.date) this.date = this.toDateStr(new Date());
    this.updatePhoneSlots();
    this.showPhoneModal = true;
  }

  updatePhoneSlots(): void {
    if (!this.date) { this.phoneAvailableSlots = []; return; }
    this.phoneAvailableSlots = this.getGeneratedSlots(this.date)
      .filter(s => !this.isBooked(this.date, s));
    if (this.heure && !this.phoneAvailableSlots.includes(this.heure)) this.heure = '';
  }

  resetPhoneForm(): void {
    this.nom = '';
    this.prenom = '';
    this.email = '';
    this.telephone = '';
    this.date = '';
    this.heure = '';
    this.isSubmitting = false;
  }

  // ── Details modal ─────────────────────────────────────────────────────────

  openDetailsModal(apt: Appointment): void {
    this.selectedAppointment = apt;
    this.showDetailsModal    = true;
  }

  // ── Overlay click (ferme si clic hors modal) ──────────────────────────────

  onOverlayClick(event: MouseEvent, modal: 'phone' | 'details'): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      if (modal === 'phone')   this.showPhoneModal   = false;
      if (modal === 'details') this.showDetailsModal = false;
    }
  }

  // ── Notification ──────────────────────────────────────────────────────────

  showNotif(message: string, type: typeof this.notifType): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notifMessage = message;
    this.notifType    = type;
    this.notifVisible = true;
    this.notifTimer   = setTimeout(() => { this.notifVisible = false; }, 3500);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toDateStr(d: Date): string {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  private isThisWeek(dateStr: string): boolean {
    const now     = new Date();
    const monday  = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday  = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const d = new Date(dateStr);
    return d >= monday && d <= sunday;
  }

  private updateLocalStatus(id: number, statut: Appointment['statut']): void {
    const update = (list: Appointment[]) => {
      const a = list.find(x => x.id === id);
      if (a) a.statut = statut;
    };
    update(this.allPatients);
    update(this.data);
    this.filterAppointments();
  }

  /** Génère les créneaux disponibles pour une date donnée selon les disponibilités */
  private getGeneratedSlots(dateStr: string): string[] {
    const dow   = (new Date(dateStr).getDay() + 6) % 7;
    const avail = this.availability[dow] || [];
    return this.timeSlots.filter(s =>
      avail.some(r => s >= r.start && s < r.end),
    );
  }

  /** Données de démo (utilisées si l'API est inaccessible) */
  private getMockData(): Appointment[] {
    const today = this.toDateStr(new Date());
    const tomorrow = this.toDateStr(new Date(Date.now() + 86400000));
    return [
      { id: 1, nom: 'Dupont', prenom: 'Marie',   email: 'marie@email.com',  date_rdv: today,    hrdv: '09:00', statut: 'confirmed', source: 'online' },
      { id: 2, nom: 'Martin', prenom: 'Jean',    email: 'jean@email.com',   date_rdv: today,    hrdv: '10:30', statut: 'pending',   source: 'phone'  },
      { id: 3, nom: 'Lemaire',prenom: 'Sophie',  email: 'sophie@email.com', date_rdv: today,    hrdv: '14:00', statut: 'pending',   source: 'online' },
      { id: 4, nom: 'Bernard',prenom: 'Claire',  email: '',                 date_rdv: tomorrow, hrdv: '09:30', statut: 'confirmed', source: 'phone'  },
      { id: 5, nom: 'Petit',  prenom: 'Thomas',  email: 'thomas@email.com', date_rdv: tomorrow, hrdv: '11:00', statut: 'cancelled', source: 'online' },
    ];
  }
}