import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-rdv-nut',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './rdv.html',
  styleUrls: ['./rdv.css']
})
export class Rdv implements OnInit {
  @Input() isMiniView = false;
  
  rendezVousAujourdhui: any[] = [];
  isLoading = true;
  errorMessage = '';
  dateDuJour: string = '';



  constructor(private http: HttpClient, private router: Router) {
    // Formater la date du jour pour l'affichage (ex: 16 Mai 2026)
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.dateDuJour = new Date().toLocaleDateString('fr-FR', options);
  }

  ngOnInit() {
    this.loadRendezVousDuJour();
  }

  loadRendezVousDuJour() {
    this.isLoading = true;
    // On appelle la route Flask qui filtre les RDV de la date actuelle
    this.http.get<any[]>('http://localhost:5000/api/nutritionniste/rdv-aujourdhui').subscribe({
      next: (data) => {
        this.rendezVousAujourdhui = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des RDV:', err);
        this.errorMessage = 'Impossible de charger les rendez-vous d’aujourd’hui.';
        this.isLoading = false;
      }
    });
  }

  // L'action clé de ton scénario : Ouvrir la consultation pour ce patient
  demarrerConsultation(idPatient: number, idRdv: number) {
    // On redirige le médecin vers le composant de consultation en passant l'id du patient
    // Exemple de route : /dashboard/consultation/5?rdv=12
    this.router.navigate(['/dashboard/consultation', idPatient], { queryParams: { rdvId: idRdv } });
  }
}