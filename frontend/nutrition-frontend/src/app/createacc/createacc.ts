// createacc.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-createacc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './createacc.html',
  styleUrls: ['./createacc.css']
})
export class Createacc {
  user = {
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  showPassword = false;

  onSubmit() {
    if (this.user.password !== this.user.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    console.log('Inscription:', this.user);
    // Appel API d'inscription ici
  }

  loginWithGoogle() {
    // Implémentation OAuth Google
    console.log('Connexion Google...');
    // window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth...';
  }
}
