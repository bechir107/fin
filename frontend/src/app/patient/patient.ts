import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Service } from '../nut/service';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './patient.html',
  styleUrls: ['./patient.css'],
})
export class PatientC implements OnInit {

  // ── Données ───────────────────────────────────────
  patients: any[] = [];
  fifi: any[]     = [];
  affiche         = false;
  chercher        = '';

  // ── Édition inline ────────────────────────────────
  editingId: number | null = null;
  savingId:  number | null = null;

  editNom               = '';
  editPrenom            = '';
  editDdn               = '';
  editSexe              = '';
  editEmail             = '';
  editTelephone         = '';
  editAdresse           = '';
  editAllergie          = '';
  editMaladie_chronique = '';
  editObjectif          = '';

  constructor(private svc: Service, private router: Router) {}

  ngOnInit() { this.getPatients(); }

  allerVersAjouter(): void {
    this.router.navigate(['/dashboard/ajouterpatient']);
  }

  // ── Chargement ────────────────────────────────────
  getPatients(): void {
    this.svc.getallPatients().subscribe({
      next:  (res: any) => { this.fifi = res.patients || res.personnes || []; },
      error: (err)      => { console.error('Erreur chargement patients', err); }
    });
  }

  // ── Recherche ─────────────────────────────────────
  filterPatients(): void {
    if (!this.chercher.trim()) {
      this.affiche = false;
      this.getPatients();
      return;
    }
    this.svc.getPatient(this.chercher).subscribe({
      next:  (data: any) => { this.patients = data.patients ?? []; this.affiche = true; },
      error: (err)       => { console.error('Erreur recherche', err); }
    });
  }

  listeActive(): any[] {
    return this.affiche ? this.patients : this.fifi;
  }

  // ── Édition inline ────────────────────────────────
  ouvrirEdit(p: any): void {
    this.editingId             = p.id;
    this.editNom               = p.nom               || '';
    this.editPrenom            = p.prenom            || '';
    this.editDdn               = p.ddn ? String(p.ddn).split('T')[0] : '';
    this.editSexe              = p.sexe              || '';
    this.editEmail             = p.email             || '';
    this.editTelephone         = p.telephone         ? String(p.telephone) : '';
    this.editAdresse           = p.adresse           || '';
    this.editAllergie          = p.allergie          || '';
    this.editMaladie_chronique = p.maladie_chronique || '';
    this.editObjectif          = p.objectif          || '';
  }

  annulerEdit(): void {
    this.editingId = null;
    this.savingId  = null;
  }

  sauvegarderEdit(id: number): void {
    if (!this.editNom.trim() || !this.editPrenom.trim()) {
      alert('Le nom et le prénom sont obligatoires.');
      return;
    }
    this.savingId = id;
    this.svc.modifierPatient({
      email             : this.editEmail,
      nom               : this.editNom,
      prenom            : this.editPrenom,
      ddn               : this.editDdn,
      telephone         : this.editTelephone,
      sexe              : this.editSexe,
      adresse           : this.editAdresse,
      allergie          : this.editAllergie,
      maladie_chronique : this.editMaladie_chronique,
      objectif          : this.editObjectif,
    }).subscribe({
      next: () => {
        this.savingId  = null;
        this.editingId = null;
        this.getPatients();
      },
      error: () => {
        this.savingId = null;
        alert('Erreur lors de la modification.');
      }
    });
  }

  // ── Suppression ───────────────────────────────────
  suppprimer(id: number): void {
    if (!confirm('Supprimer ce patient ?')) return;
    this.svc.supppatient(id).subscribe({
      next:  () => { this.getPatients(); },
      error: () => { alert('Erreur lors de la suppression.'); }
    });
  }

  acces(email: string): void {
    this.svc.accesP(email).subscribe({
      next:  (res: any) => alert(res.message),
      error: ()         => alert("Erreur lors de l'envoi de l'accès")
    });
  }
}
