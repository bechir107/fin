import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Service } from '../nut/service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {

  constructor(private service: Service, private cdr: ChangeDetectorRef) {}

  email      = '';
  loading    = false;
  errorMsg   = '';
  successMsg = '';

  send(): void {
    if (!this.email || this.loading) return;

    this.loading  = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.service.accesP(this.email).subscribe({
      next: (res: any) => {
        this.loading    = false;
        this.successMsg = res.message ?? 'Un e-mail vous a été envoyé avec votre mot de passe.';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err.error?.message ?? 'Email introuvable. Vérifiez votre adresse.';
        this.cdr.detectChanges();
      }
    });
  }
}