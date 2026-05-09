import { Component, OnInit } from '@angular/core';
import { Service } from '../nut/service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-espacep',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './espacep.html',
  styleUrl: './espacep.css',
})
export class Espacep implements OnInit {
  nom = '';
  prenom = '';

  constructor(private service: Service, private router: Router) { }

  ngOnInit() {
    const user = this.service.cuurrentUser;
    if (user) {
      this.nom = user.nom;
      this.prenom = user.prenom;
    }
    console.log('Utilisateur connecté :', this.nom, this.prenom);
  }

  logout() {
    this.service.cuurrentUser = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('app_user');
      localStorage.removeItem('google_user');
    }
    this.router.navigate(['/login']);
  }
}