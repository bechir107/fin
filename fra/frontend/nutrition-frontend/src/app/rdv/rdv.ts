import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Service } from '../nut/service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Appointment {
  id: number;
  nom: string;
  prenom: string;
  date_rdv: string;
  hrdv: string;
  type: 'online' | 'phone';
  statut: 'confirmed' | 'pending' | 'cancelled';
  email: string;
}

interface TimeRange { start: string; end: string; }

@Component({
  selector: 'app-rdv',
  templateUrl: './rdv.html',
  styleUrls: ['./rdv.css'],
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None
})
export class Rdv implements OnInit {

  nom: string = '';
  prenom: string = '';
  date: string = '';
  email: string = '';
  heure: string = '';

  @ViewChild('weekChart') weekChartRef!: ElementRef;
  @ViewChild('futureChart') futureChartRef!: ElementRef;

  data: any[] = [];
  allPatients: any[] = [];
  chart: any;
  futureChart: any;

  activeSection = 'calendar';
  aujordhui: any = [];

  currentDate = new Date();
  selectedDate: string | null = null;
  calendarCells: any[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  get currentMonthLabel() {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  get selectedDateLabel() {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00'
  ];

  dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  availability: TimeRange[][] = [[], [], [], [], [], [], []];

  settings = { onlineBooking: true, reminders: true, onlineCancel: false };

  // ✅ appointments vient du backend maintenant
  appointments: any[] = [];

  filteredAppointments: any[] = [];
  filterStatus = 'all';
  filterType = 'all';

  todayCount = 0;
  weekCount = 0;
  onlineCount = 0;
  phoneCount = 0;
  pendingCount = 0;

  showPhoneModal = false;
  showSuccessCard = false; // ✅ Nouvel état pour la carte de succès
  showDetailsModal = false;
  selectedAppointment: any = null;

  phoneAvailableSlots: string[] = [];

  notifVisible = false;
  notifMessage = '';
  notifType = 'success';

  constructor(
    private service: Service,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  // ─────────────────────────────────────────
  // ✅ ngOnInit — UNE SEULE FOIS
  // ─────────────────────────────────────────
  ngOnInit(): void {
    this.afficher();
    this.buildCalendar();
    this.updateStats();
    this.chargerDisponibilite();
  }

  // ─────────────────────────────────────────
  // BACKEND
  // ─────────────────────────────────────────

  rdv() {
    if (!this.nom || !this.prenom || !this.date) {
      this.showNotif('Veuillez remplir vos informations', 'error');
      return;
    }
    if (!this.heure) {
      this.showNotif('Veuillez sélectionner une heure', 'error');
      return;
    }
    this.service.rondv(this.nom, this.prenom, this.email, this.date, this.heure).subscribe({
      next: (response) => {
        this.showPhoneModal = false;
        this.nom = ''; this.prenom = ''; this.email = '';
        this.date = ''; this.heure = '';
        this.afficher();
        this.showSuccessCard = true;
        setTimeout(() => this.showSuccessCard = false, 4000);
      },
      error: (error) => {
        this.showNotif('Erreur lors de l\'ajout', 'error');
        console.log(error);
      }
    });
  }

  supprdv(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.service.supprdv(id).subscribe({
      next: () => {
        this.afficher();
        this.showNotif('Rendez-vous annulé', 'warning');
      },
      error: (err) => console.error(err)
    });
  }

  afficher(): void {
    this.service.getPatients().subscribe({
      next: (response: { patients: any[] }) => {
        this.allPatients = response.patients.filter(p => p.date_rdv);

        // RDV d'aujourd'hui seulement pour le calendrier
        const aujourdhui = new Date();
        this.data = this.allPatients.filter((p: any) => {
          const d = new Date(p.date_rdv);
          return d.getDate() === aujourdhui.getDate() &&
            d.getMonth() === aujourdhui.getMonth() &&
            d.getFullYear() === aujourdhui.getFullYear();
        });

        // ✅ Mettre à jour appointments pour le calendrier
        this.appointments = this.allPatients.map(p => ({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          date: new Date(p.date_rdv).toISOString().split('T')[0],
          time: this.padTime(p.hrdv),
          date_rdv: p.date_rdv,
          hrdv: this.padTime(p.hrdv),
          email: p.email,
          statut: p.statut || 'pending',
          status: p.statut || 'pending',
          type: 'online'
        }));

        this.updateStats();
        this.applyFilters();
        this.cdr.detectChanges(); // ✅ Force Angular à rafraîchir l'interface

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.buildChart();
            this.buildFutureChart();
          }, 300);
        }
      },
      error: (err) => console.error(err)
    });
  }

  confirmAppointment(id: number) {
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      this.service.accepterRdv(id).subscribe({
        next: () => {
          apt.status = 'confirmed';
          apt.statut = 'confirmed';
          this.updateStats();
          this.buildCalendar();
          this.applyFilters();
          this.showNotif('Rendez-vous confirmé !', 'success');
        },
        error: () => this.showNotif('Erreur de confirmation', 'error')
      });
    }
  }

  cancelAppointment(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.supprdv(id);
  }

  openDetailsModal(apt: any) {
    this.selectedAppointment = apt;
    this.showDetailsModal = true;
  }

  // ─────────────────────────────────────────
  // CHARTS
  // ─────────────────────────────────────────

  buildChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const ctx = this.weekChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const today = new Date();
    const days: { label: string; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), date: d });
    }

    const counts = days.map(day =>
      this.allPatients.filter(p => {
        const d = new Date(p.date_rdv);
        return d.getDate() === day.date.getDate() &&
          d.getMonth() === day.date.getMonth() &&
          d.getFullYear() === day.date.getFullYear();
      }).length
    );

    if (this.chart) this.chart.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(45,106,69,0.35)');
    gradient.addColorStop(1, 'rgba(45,106,69,0.01)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days.map(d => d.label),
        datasets: [{ label: 'Patients', data: counts, fill: true, backgroundColor: gradient, borderColor: '#2d6a45', borderWidth: 2.5, tension: 0.45, pointBackgroundColor: '#2d6a45' }]
      },
      options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, callback: (v) => Number.isInteger(Number(v)) ? v : '' } } } }
    });
  }

  buildFutureChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const ctx = this.futureChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const today = new Date();
    const days: { label: string; date: Date }[] = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), date: d });
    }

    const counts = days.map(day =>
      this.allPatients.filter(p => {
        const d = new Date(p.date_rdv);
        return d.getDate() === day.date.getDate() &&
          d.getMonth() === day.date.getMonth() &&
          d.getFullYear() === day.date.getFullYear();
      }).length
    );

    if (this.futureChart) this.futureChart.destroy();
    this.futureChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days.map(d => d.label),
        datasets: [{ label: 'Rendez-vous', data: counts, backgroundColor: '#2563eb' }]
      },
      options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, callback: (v) => Number.isInteger(Number(v)) ? v : '' } } } }
    });
  }

  // ─────────────────────────────────────────
  // CALENDRIER
  // ─────────────────────────────────────────

  buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    this.calendarCells = [];
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = offset; i > 0; i--) {
      this.calendarCells.push({ day: daysInPrev - i + 1, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.calendarCells.push({
        day: d, otherMonth: false, dateStr,
        isToday: today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
      });
    }
    const remaining = 42 - this.calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
      this.calendarCells.push({ day: d, otherMonth: true });
    }
  }

  changeMonth(delta: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    this.currentDate = new Date(this.currentDate);
    this.buildCalendar();
  }

  selectDate(dateStr: string) { this.selectedDate = dateStr; }

  // ─────────────────────────────────────────
  // SLOTS
  // ─────────────────────────────────────────

  getAvailableSlots(dateStr: string): string[] {
    const day = new Date(dateStr).getDay();
    const slots: string[] = [];
    this.availability[day].forEach(range => {
      let cur = range.start;
      while (cur < range.end) {
        slots.push(cur);
        const [h, m] = cur.split(':').map(Number);
        const nm = m + 60; // ← 1h par créneau
        cur = `${String(h + Math.floor(nm / 60)).padStart(2, '0')}:${String(nm % 60).padStart(2, '0')}`;
      }
    });
    return slots;
  }

  isBooked(dateStr: string, time: string): boolean {
    return this.appointments.some(a => a.date === dateStr && a.time === time && a.status === 'confirmed');
  }

  isAvailableSlot(dateStr: string, time: string): boolean {
    return this.getAvailableSlots(dateStr).includes(time);
  }

  getSlotTitle(dateStr: string, time: string): string {
    const apt = this.appointments.find(a => a.date === dateStr && a.time === time && a.status === 'confirmed');
    return apt ? `${apt.nom} ${apt.prenom}` : '';
  }

  onSlotClick(dateStr: string, time: string) {
    const apt = this.appointments.find(a => a.date === dateStr && a.time === time && a.status === 'confirmed');
    if (apt) this.openDetailsModal(apt);
  }

  getBooked(dateStr: string) {
    return this.appointments.filter(a => a.date === dateStr && a.status === 'confirmed').length;
  }
  getPending(dateStr: string) {
    return this.appointments.filter(a => a.date === dateStr && a.status === 'pending').length;
  }
  getAvailable(dateStr: string) {
    return this.getAvailableSlots(dateStr).filter(s => !this.isBooked(dateStr, s)).length;
  }

  // ─────────────────────────────────────────
  // DISPONIBILITÉS — MySQL
  // ─────────────────────────────────────────

  chargerDisponibilite() {
    this.service.getDisponibilite().subscribe((res: any[]) => {
      this.availability = this.dayNames.map(() => []);
      res.forEach(slot => {
        const idx = this.dayNames.findIndex(day => day.toLowerCase() === slot.jour.toLowerCase());
        if (idx >= 0) {
          this.availability[idx].push({ start: this.padTime(slot.heure_debut), end: this.padTime(slot.heure_fin) });
        }
      });
      this.cdr.detectChanges(); // ✅ Force Angular à rafraîchir le calendrier avec les dispo
    });
  }

  addSlot(day: number) {
    this.availability[day].push({ start: '09:00', end: '12:00' });
  }

  removeSlot(day: number, i: number) {
    if (confirm('Voulez-vous vraiment retirer ce créneau de vos disponibilités ?\n(N\'oubliez pas de Sauvegarder ensuite)')) {
      this.availability[day].splice(i, 1);
    }
  }

  // ✅ saveAvailability — sauvegarde dans MySQL
  saveAvailability() {
    const slots: any[] = [];
    this.availability.forEach((ranges, idx) => {
      ranges.forEach(range => {
        slots.push({ jour: this.dayNames[idx], heure_debut: range.start, heure_fin: range.end });
      });
    });
    this.service.saveDisponibilite(slots).subscribe({
      next: () => {
        this.buildCalendar();
        this.showNotif('Disponibilités sauvegardées !', 'success');
      },
      error: () => this.showNotif('Erreur de sauvegarde', 'error')
    });
  }

  // ─────────────────────────────────────────
  // MODAL TÉLÉPHONIQUE
  // ─────────────────────────────────────────

  openPhoneModal() {
    this.nom = ''; this.prenom = ''; this.email = '';
    this.date = ''; this.heure = '';
    this.phoneAvailableSlots = [];
    this.showPhoneModal = true;
  }

  updatePhoneSlots() {
    if (!this.date) {
      this.phoneAvailableSlots = [];
      return;
    }
    const allSlots = this.getAvailableSlots(this.date);
    this.phoneAvailableSlots = allSlots.filter(s => !this.isBooked(this.date, s));
  }

  // ─────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────

  updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const active = this.appointments.filter(a => a.status !== 'cancelled');
    this.todayCount = active.filter(a => a.date === today).length;
    this.weekCount = active.filter(a => {
      const d = new Date(a.date);
      return d >= weekStart && d <= weekEnd;
    }).length;
    this.onlineCount = active.filter(a => a.type === 'online').length;
    this.phoneCount = active.filter(a => a.type === 'phone').length;
    this.pendingCount = this.appointments.filter(a => a.status === 'pending').length;
  }

  applyFilters() {
    this.filteredAppointments = this.appointments
      .filter(a => this.filterStatus === 'all' || a.status === this.filterStatus)
      .filter(a => this.filterType === 'all' || a.type === this.filterType);
  }

  // ─────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────

  onOverlayClick(e: MouseEvent, modal: string) {
    if (e.target === e.currentTarget) {
      if (modal === 'phone') this.showPhoneModal = false;
      if (modal === 'details') this.showDetailsModal = false;
    }
  }

  showNotif(msg: string, type = 'success') {
    this.notifMessage = msg;
    this.notifType = type;
    this.notifVisible = true;
    setTimeout(() => this.notifVisible = false, 3000);
  }

  // ✅ Normalise les heures pour éviter les bugs avec "9:00:" au lieu de "09:00"
  padTime(t: string): string {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return t;
  }
} 