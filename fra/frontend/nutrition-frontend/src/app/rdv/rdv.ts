import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, Inject, PLATFORM_ID } from '@angular/core';
import { Service } from '../nut/service';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Appointment {
  id: number;
  name: string;
  date: string;
  time: string;
  type: 'online' | 'phone';
  status: 'confirmed' | 'pending' | 'cancelled';
  phone: string;
  email: string;
  notes: string;
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
  date: string = ''
  email: string = '';
  heure: string = '';


  @ViewChild('weekChart') weekChartRef!: ElementRef;
  @ViewChild('futureChart') futureChartRef!: ElementRef;

  // ── Données backend (existant)
  data: any[] = [];
  allPatients: any[] = [];
  chart: any;
  futureChart: any;
  i = 0;

  activeSection = 'calendar';
  aujordhui: any = []
  afficherdv() {
    this.service.getPatients().subscribe({
      next: (response) => {
        const aujourdhui = new Date().toISOString().split('T')[0]; // "2026-04-21"

        this.aujordhui = response.patients.filter((p: any) => {
          if (!p.date_rdv) return false;
          const dateRdv = new Date(p.date_rdv).toISOString().split('T')[0];
          return dateRdv === aujourdhui;
        });

        console.log(this.aujordhui)

      },
      error: (error) => {
        console.log(error);
      }
    });
  }


  currentDate = new Date();
  selectedDate: string | null = null;
  calendarCells: any[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  get currentMonthLabel() {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  rdv() {
    this.service.rondv(this.nom, this.prenom, this.email, this.date, this.heure).subscribe({
      next: (response) => {
        console.log(response);
      },
      error: (error) => {
        console.log(error);
      }
    })
  }
  get selectedDateLabel() {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ── Créneaux horaires
  timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // ── Disponibilités
  dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  availability: TimeRange[][] = [
    [],
    [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    [{ start: '09:00', end: '12:00' }],
    []
  ];

  settings = { onlineBooking: true, reminders: true, onlineCancel: false };

  // ── Rendez-vous
  appointments: Appointment[] = [
    { id: 1, name: 'Marie Dupont', date: '2026-04-19', time: '09:00', type: 'online', status: 'confirmed', phone: '06 12 34 56 78', email: 'marie@email.com', notes: 'Première consultation' },
    { id: 2, name: 'Jean Martin', date: '2026-04-19', time: '10:30', type: 'phone', status: 'confirmed', phone: '07 98 76 54 32', email: '', notes: 'Suivi mensuel' },
    { id: 3, name: 'Sophie Bernard', date: '2026-04-19', time: '14:00', type: 'online', status: 'pending', phone: '06 45 67 89 01', email: 'sophie@email.com', notes: 'Rééquilibrage alimentaire' },
    { id: 4, name: 'Pierre Durand', date: '2026-04-19', time: '16:30', type: 'phone', status: 'confirmed', phone: '07 11 22 33 44', email: '', notes: 'Contrôle après 3 mois' },
    { id: 5, name: 'Claire Petit', date: '2026-04-20', time: '09:00', type: 'online', status: 'confirmed', phone: '06 55 66 77 88', email: 'claire@email.com', notes: 'Consultation grossesse' },
    { id: 6, name: 'Lucas Moreau', date: '2026-04-21', time: '11:00', type: 'phone', status: 'pending', phone: '07 99 88 77 66', email: '', notes: 'Prise de masse musculaire' }
  ];

  filteredAppointments: Appointment[] = [];
  filterStatus = 'all';
  filterType = 'all';

  // ── Stats (utilisées dans le HTML)
  todayCount = 0;
  weekCount = 0;
  onlineCount = 0;
  phoneCount = 0;
  pendingCount = 0;

  // ── Modals
  showPhoneModal = false;
  showDetailsModal = false;
  selectedAppointment: Appointment | null = null;

  phoneBooking = {
    firstName: '', lastName: '', phone: '',
    email: '', date: '', time: '', type: 'first', notes: ''
  };
  phoneAvailableSlots: string[] = [];

  // ── Notification
  notifVisible = false;
  notifMessage = '';
  notifType = 'success';

  constructor(
    private service: Service,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) { }

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────

  ngOnInit(): void {
    this.afficher();
    this.buildCalendar();
    this.applyFilters();
    this.updateStats();
  }

  // ─────────────────────────────────────────
  // BACKEND (code existant inchangé)
  // ─────────────────────────────────────────

  supprdv(id: number) {
    this.i = this.i + 1;
    this.service.supprdv(id).subscribe({
      next: () => {
        this.afficher();
        alert('Rendez-vous sera annulé');
      },
      error: (err) => console.error('Erreur lors de la suppression du rendez-vous', err)
    });
  }

  afficher(): void {
    this.service.getPatients().subscribe({
      next: (response: { patients: any[] }) => {
        this.allPatients = response.patients.filter(p => p.date_rdv);

        const aujourdhui = new Date();
        this.data = this.allPatients.filter((p: any) => {
          const d = new Date(p.date_rdv);
          return d.getDate() === aujourdhui.getDate() &&
            d.getMonth() === aujourdhui.getMonth() &&
            d.getFullYear() === aujourdhui.getFullYear();
        });

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.buildChart();
            this.buildFutureChart();
          }, 300);
        }
        console.log(this.allPatients)
      },
      error: (err) => console.error(err)
    });
  }

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
        datasets: [{
          label: 'Patients',
          data: counts,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#2d6a45',
          borderWidth: 2.5,
          tension: 0.45,
          pointBackgroundColor: '#2d6a45'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
              callback: (value) => Number.isInteger(Number(value)) ? value : ''
            }
          }
        }
      }
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
        datasets: [{
          label: 'Rendez-vous',
          data: counts,
          backgroundColor: '#2563eb'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
              callback: (value) => Number.isInteger(Number(value)) ? value : ''
            }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────
  // CALENDRIER UI
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
        day: d,
        otherMonth: false,
        dateStr,
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

  selectDate(dateStr: string) {
    this.selectedDate = dateStr;
  }

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
        const nm = m + 30;
        cur = `${String(h + Math.floor(nm / 60)).padStart(2, '0')}:${String(nm % 60).padStart(2, '0')}`;
      }
    });
    return slots;
  }

  isBooked(dateStr: string, time: string): boolean {
    return this.appointments.some(a => a.date === dateStr && a.time === time && a.status !== 'cancelled');
  }

  isAvailableSlot(dateStr: string, time: string): boolean {
    return this.getAvailableSlots(dateStr).includes(time);
  }

  getSlotTitle(dateStr: string, time: string): string {
    const apt = this.appointments.find(a => a.date === dateStr && a.time === time && a.status !== 'cancelled');
    return apt ? `${apt.name} (${apt.type === 'phone' ? 'Téléphone' : 'En ligne'})` : '';
  }

  onSlotClick(dateStr: string, time: string) {
    const apt = this.appointments.find(a => a.date === dateStr && a.time === time && a.status !== 'cancelled');
    if (apt) this.openDetailsModal(apt);
  }

  getBooked(dateStr: string) { return this.appointments.filter(a => a.date === dateStr && a.status !== 'cancelled').length; }
  getPending(dateStr: string) { return this.appointments.filter(a => a.date === dateStr && a.status === 'pending').length; }
  getAvailable(dateStr: string) { return this.getAvailableSlots(dateStr).length; }

  // ─────────────────────────────────────────
  // RENDEZ-VOUS
  // ─────────────────────────────────────────

  applyFilters() {
    this.filteredAppointments = this.appointments
      .filter(a => this.filterStatus === 'all' || a.status === this.filterStatus)
      .filter(a => this.filterType === 'all' || a.type === this.filterType)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }

  confirmAppointment(id: number) {
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = 'confirmed';
      this.applyFilters();
      this.updateStats();
      this.buildCalendar();
      this.showNotif('Rendez-vous confirmé !', 'success');
    }
  }

  cancelAppointment(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = 'cancelled';
      this.applyFilters();
      this.updateStats();
      this.buildCalendar();
      this.showNotif('Rendez-vous annulé', 'warning');
    }
  }

  openDetailsModal(apt: Appointment) {
    this.selectedAppointment = apt;
    this.showDetailsModal = true;
  }

  // ─────────────────────────────────────────
  // MODAL TÉLÉPHONIQUE
  // ─────────────────────────────────────────

  openPhoneModal() {
    const today = new Date().toISOString().split('T')[0];
    this.phoneBooking = { firstName: '', lastName: '', phone: '', email: '', date: today, time: '', type: 'first', notes: '' };
    this.updatePhoneSlots();
    this.showPhoneModal = true;
  }

  updatePhoneSlots() {
    this.phoneAvailableSlots = this.phoneBooking.date
      ? this.getAvailableSlots(this.phoneBooking.date)
      : [];
  }

  submitPhoneBooking() {
    const apt: Appointment = {
      id: Date.now(),
      name: `${this.phoneBooking.firstName} ${this.phoneBooking.lastName}`,
      date: this.phoneBooking.date,
      time: this.phoneBooking.time,
      type: 'phone',
      status: 'confirmed',
      phone: this.phoneBooking.phone,
      email: this.phoneBooking.email,
      notes: this.phoneBooking.notes
    };
    this.appointments.push(apt);
    this.showPhoneModal = false;
    this.applyFilters();
    this.updateStats();
    this.buildCalendar();
    this.showNotif('RDV téléphonique ajouté !', 'success');
  }

  // ─────────────────────────────────────────
  // DISPONIBILITÉS
  // ─────────────────────────────────────────

  addSlot(day: number) {
    this.availability[day].push({ start: '09:00', end: '12:00' });
  }

  removeSlot(day: number, i: number) {
    this.availability[day].splice(i, 1);
  }

  saveAvailability() {
    this.buildCalendar();
    this.showNotif('Disponibilités sauvegardées !', 'success');
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
    this.weekCount = active.filter(a => { const d = new Date(a.date); return d >= weekStart && d <= weekEnd; }).length;
    this.onlineCount = active.filter(a => a.type === 'online').length;
    this.phoneCount = active.filter(a => a.type === 'phone').length;
    this.pendingCount = this.appointments.filter(a => a.status === 'pending').length;
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
}