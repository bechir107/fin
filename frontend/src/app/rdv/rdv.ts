import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, Inject, PLATFORM_ID } from '@angular/core';
import { Service } from '../nut/service';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-rdv',
  templateUrl: './rdv.html',
  styleUrls: ['./rdv.css'],
  imports: [CommonModule, DatePipe],
  encapsulation: ViewEncapsulation.None
})
export class Rdv implements OnInit {

  @ViewChild('weekChart') weekChartRef!: ElementRef;
  @ViewChild('futureChart') futureChartRef!: ElementRef;

  data: any[] = [];
  allPatients: any[] = [];
  chart: any;
  futureChart: any;

  constructor(
    private service: Service,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.afficher();
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
          }, 300); // ✅ 300ms pour laisser Angular rendre le DOM
        }
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
      days.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        date: d
      });
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
      days.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        date: d
      });
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
}