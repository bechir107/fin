import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css']
})
export class Stats implements OnInit, AfterViewInit {
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typesChart') typesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ageChart') ageChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly API = 'http://127.0.0.1:5000';
  
  totalPatients = 0;
  monthlyRdv = 0;
  confirmRate = '0%';
  cancelRate = '0%';

  activityChartInstance: Chart | null = null;
  typesChartInstance: Chart | null = null;
  ageChartInstance: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  fetchData() {
    this.http.get<{rendez_vous: any[]}>(`${this.API}/rendez_vous`).subscribe({
      next: (res) => {
        const rdvs = res.rendez_vous || [];
        this.monthlyRdv = rdvs.length;
        const confirmed = rdvs.filter(r => r.statut === 'confirme' || r.statut === 'confirmed').length;
        const cancelled = rdvs.filter(r => r.statut === 'annule' || r.statut === 'cancelled').length;
        
        if (rdvs.length > 0) {
          this.confirmRate = Math.round((confirmed / rdvs.length) * 100) + '%';
          this.cancelRate = Math.round((cancelled / rdvs.length) * 100) + '%';
        }
      },
      error: () => {
        // Fallback mock data
        this.monthlyRdv = 124;
        this.confirmRate = '85%';
        this.cancelRate = '12%';
      }
    });

    this.http.get<{patients: any[]}>(`${this.API}/allpatient`).subscribe({
      next: (res) => {
        this.totalPatients = (res.patients || []).length;
      },
      error: () => {
        this.totalPatients = 342;
      }
    });
  }

  initCharts() {
    if (!this.activityChartRef || !this.typesChartRef || !this.ageChartRef) return;

    this.activityChartInstance = new Chart(this.activityChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Consultations',
          data: [12, 19, 15, 25, 22, 10, 5],
          borderColor: '#4caf6a',
          backgroundColor: 'rgba(76, 175, 106, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });

    this.typesChartInstance = new Chart(this.typesChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Première consultation', 'Suivi mensuel', 'Suivi hebdomadaire'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: ['#4caf6a', '#FF9800', '#1a2e1c'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    this.ageChartInstance = new Chart(this.ageChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['<18', '18-25', '26-40', '41-60', '>60'],
        datasets: [{
          label: 'Patients',
          data: [15, 45, 80, 60, 20],
          backgroundColor: '#4caf6a',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}
