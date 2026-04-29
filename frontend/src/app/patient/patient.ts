import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
  fifi: any[] = [];
  
  // ── État UI ───────────────────────────────────────
  activeTab  = 'info';
  showForm   = false;
  affiche    = false;
  selectedIndex: number | null = null;
  chercher = '';

  // ── Champs formulaire (alignés avec la Base de Données) ────────
  nom               = '';
  prenom            = '';
  ddn               = '';
  sexe              = '';
  email             = '';
  password          = '';
  telephone         = '';
  adresse           = '';
  taille            = '';
  allergie          = '';
  maladie_chronique = '';
  objectif          = '';

  constructor(private svc: Service) {}

  ngOnInit() {
    this.getPatients();
  }

  getPatients() {
    this.svc.getallPatients().subscribe({
      next: (res: any) => {
        this.fifi = res.patients || res.personnes || [];
      },
      error: (err) => {
        console.error("Erreur chargement patients", err);
      }
    });
  }

  // ── Recherche / filtre ────────────────────────────
  filterPatients(): void {
    if (!this.chercher.trim()) {
      this.affiche = false;
      this.getPatients();
      return;
    }
    this.svc.getPatient(this.chercher).subscribe({
      next: (data: any) => {
        this.patients = data.patients ?? [];
        this.affiche  = true;
      },
      error: (err) => {
        console.error('Erreur lors de la recherche', err);
      }
    });
  }

  suivant(){
    this.activeTab = 'sante';
  }

  // ── Ajouter un patient ────────────────────────────
  ajouterP(form: NgForm): void {
   
    // ── 1. INFOS PERSONNELLES ───────────────────────
    if (!this.nom?.trim() || !this.prenom?.trim()) {
      alert('⚠️ Le nom et le prénom sont obligatoires.');
      this.activeTab = 'info';
      return;
    }
   
    if (!this.ddn) {
      alert('⚠️ Veuillez saisir la date de naissance.');
      this.activeTab = 'info';
      return;
    }
   
    if (!this.sexe) {
      alert('⚠️ Veuillez sélectionner le sexe.');
      this.activeTab = 'info';
      return;
    }
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email?.trim() || !emailRegex.test(this.email.trim())) {
      alert('⚠️ Veuillez saisir un email valide.');
      this.activeTab = 'info';
      return;
    }
   
    const telRegex = /^[0-9\s\+\-]{8,15}$/;
    if (!this.telephone?.trim() || !telRegex.test(this.telephone.trim()) || this.telephone.trim().length < 8) {
      alert('⚠️ Veuillez saisir un numéro de téléphone valide.');
      this.activeTab = 'info';
      return;
    }
   
    if (!this.adresse?.trim()) {
      alert('⚠️ L\'adresse est obligatoire.');
      this.activeTab = 'info';
      return;
    }
   
    // ── 2. DONNÉES DE SANTÉ ─────────────────────────
    const t = parseFloat(this.taille);
    if (!this.taille || t < 50 || t > 250) {
      alert('⚠️ Veuillez saisir une taille valide (50 – 250 cm).');
      this.activeTab = 'sante';
      return;
    }
   
    if (!this.objectif) {
      alert('⚠️ Veuillez sélectionner un objectif nutritionnel.');
      this.activeTab = 'sante';
      return;
    }

    // Date de création (aujourd'hui)
    const ddc = new Date().toISOString().split('T')[0];
   
    // ── 4. TOUT EST VALIDE → APPEL SERVICE ─────────
    this.svc.ajouterpatient(
      this.nom,
      this.prenom,
      this.ddn,
      this.sexe,
      this.email,
      this.password,
      this.telephone,
      this.adresse,
      this.taille,
      this.allergie || 'Aucune',
      this.maladie_chronique || 'Aucune',
      this.objectif,
      ddc
    ).subscribe({
      next: () => {
        alert('✅ Patient ajouté avec succès !');
        form.reset();
        this.resetChamps();
        this.activeTab = 'info';
        this.closeForm();
        this.getPatients();
        this.affiche = false;
      },
      error: (err) => {
        console.error('Erreur ajout patient :', err);
        if (err.status === 409) {
          alert('❌ Cet e-mail est déjà utilisé.');
        } else {
          alert('❌ Une erreur est survenue. Veuillez vérifier les informations.');
        }
      }
    });
  }

  // ── Gestion de la modal ───────────────────────────
  openForm(): void {
    this.showForm  = true;
    this.activeTab = 'info';
  }

  closeForm(): void {
    this.showForm = false;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeForm();
    }
  }

  // ── Helpers statistiques ──────────────────────────
  countBySexe(sexe: string): number {
    return (this.fifi || []).filter(p => p.sexe === sexe).length;
  }

  countWithObjectif(): number {
    return (this.fifi || []).filter(p => p.objectif && p.objectif !== 'Non défini' && p.objectif !== '—').length;
  }

  // ── Reset interne des champs ──────────────────────
  private resetChamps(): void {
    this.nom               = '';
    this.prenom            = '';
    this.ddn               = '';
    this.sexe              = '';
    this.email             = '';
    this.password          = '';
    this.telephone         = '';
    this.adresse           = '';
    this.taille            = '';
    this.allergie          = '';
    this.maladie_chronique = '';
    this.objectif          = '';
  }

  toggleCard(index: number) {
    if (this.selectedIndex === index) {
      this.selectedIndex = null; // fermer
    } else {
      this.selectedIndex = index; // ouvrir
    }
  }

  acces(email: string){
    this.svc.accesP(email).subscribe({
      next: (res) => {
        alert((res as any).message);
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l\'envoi de l\'accès');
      }
    });
  }

  suppprimer(id: number){
    if(confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      this.svc.supppatient(id).subscribe({
        next: () => {
          alert('✅ Patient supprimé avec succès !');
          this.getPatients();
        },
        error: (err) => {
          console.error(err);
          alert('❌ Erreur lors de la suppression.');
        }
      });
    }
  }
}
