import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../nut/service';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css',
})
export class Profil implements OnInit {

  id: number = 0;
  patient: any = null;
  email = "";
  mot = false;           // ✅ contrôle affichage input
  newPassword = "";      // ✅ nouveau mot de passe

  constructor(private service: Service) { }

  ngOnInit() {
    const user = this.service.cuurrentUser;
    if (user && user.id) {
      this.id = user.id;
      this.email = user.email;
      this.recuprer();
    } else {
      console.error("Utilisateur non trouvé !");
    }
  }

  recuprer() {
    this.service.getId(this.id).subscribe({
      next: (response: any) => {
        this.patient = Array.isArray(response) ? response[0] : response;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  // ✅ Toggle affichage input + sauvegarde
  motp() {
    if (!this.mot) {
      this.mot = true;  // affiche l'input
    } else {
      if (!this.newPassword) return;
      this.service.updatePassword(this.id, this.newPassword).subscribe({
        next: () => {
          this.showNotif('pass modfier', 'success');
          this.mot = false;
          this.newPassword = "";
          this.recuprer();
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  // ── NOTIFICATIONS ─────────────────────────────────
  notifVisible = false;
  notifMessage = '';
  notifType = 'success';

  showNotif(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.notifMessage = msg;
    this.notifType = type;
    this.notifVisible = true;
    setTimeout(() => this.notifVisible = false, 3000);
  }
}