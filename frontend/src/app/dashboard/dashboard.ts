import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  searchQuery: string = '';
  showRdvSubmenu: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Garde le sous-menu ouvert si la page active est déjà 'rdv' ou 'calendrier' (ex: après un F5)
    this.checkActiveRoute(this.router.url);

    // Écoute les changements de route pour adapter le sous-menu dynamiquement
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkActiveRoute(event.url);
    });
  }

  toggleRdvSubmenu(event: MouseEvent): void {
    // Inverse l'état du sous-menu au clic sur l'élément parent
    this.showRdvSubmenu = !this.showRdvSubmenu;
  }

  private checkActiveRoute(url: string): void {
    if (url.includes('/dashboard/rdv') || url.includes('/dashboard/calendrier')) {
      this.showRdvSubmenu = true;
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.router.navigate(['/login']);
  }
}