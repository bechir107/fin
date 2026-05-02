import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Service } from '../nut/service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  constructor(private service: Service, private router: Router, private cdr: ChangeDetectorRef) { }

  activeTab: 'patient' | 'nutritionniste' = 'patient';
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMsg = '';
  email = '';
  password = '';

  features = [
    { icon: '📋', label: 'Consultez votre programme alimentaire' },
    { icon: '📈', label: 'Suivez l\'évolution de votre poids' },
    { icon: '⚖️', label: 'Visualisez votre avant / après' },
    { icon: '🔒', label: 'Données sécurisées et confidentielles' },
  ];

  onSubmit() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.errorMsg = '';

    if (this.activeTab == 'patient') {
      this.service.login(this.email, this.password).subscribe({
        next: (res: any) => {
          console.log('Réponse API :', res); // ← vérifie ce que retourne l'API

          if (res.message === 'Connexion réussie') {
            localStorage.setItem('currentUser', JSON.stringify(res));
            this.service.cuurrentUser = res;
            this.router.navigate(['/espacep/rdvp']); // ← utilise un chemin absolu
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Erreur de connexion';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
    else if (this.activeTab == 'nutritionniste') {
      this.service.loginNut(this.email, this.password).subscribe({
        next: (res: any) => {
          if (res.message === 'Connexion réussie') {
            localStorage.setItem('currentUser', JSON.stringify(res));
            this.service.cuurrentUser = res;

            this.router.navigate(['/dashboard/rdv']);
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Erreur de connexion';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

}