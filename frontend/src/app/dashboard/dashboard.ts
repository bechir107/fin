import { Component } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router'; // ← tout depuis @angular/router

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet,RouterLink,RouterLinkActive], // ← ajouter ici
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']); // ← tu peux maintenant utiliser navigate
  }

}