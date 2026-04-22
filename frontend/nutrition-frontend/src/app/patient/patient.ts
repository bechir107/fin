import { Component } from '@angular/core';
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
export class PatientC {
p: any;

  
goTo(arg0: string) {
throw new Error('Method not implemented.');
}

  // ── Données ───────────────────────────────────────
  patients: any[] = [];

  // ── État UI ───────────────────────────────────────
  activeTab  = 'info';
  showForm   = false;
  affiche    = false;
   // ── Champs formulaire ─────────────────────────────

  nom          = '';
  prenom       = '';
  age          = '';
  sexe         = '';
  email        = '';
  password     = '';
  tel          = '';
  adress       = '';
  note_interne = '';
  Taille       = '';
  poids_actuiele = '';
  Allergie     = '';
  Conditions_me = '';
  niveau_act   = '';
  objectif     = '';
  description  = '';

  // ── Recherche ─────────────────────────────────────
  chercher = '';
  selectedPatient: any = null;
  niveaux = [
  { val: 'Sédentaire', icon: '🛋️', desc: 'Peu ou pas d\'exercice' },
  { val: 'Légère',     icon: '🚶', desc: '1–3 jours / semaine'   },
  { val: 'Modérée',    icon: '🚴', desc: '3–5 jours / semaine'   },
  { val: 'Intense',    icon: '🏋️', desc: '6–7 jours / semaine'   },
  { val: 'Extrême',    icon: '🔥', desc: 'Athlète professionnel'  },
];

  constructor(private svc: Service) {}
  

  // ── Recherche / filtre ────────────────────────────
  filterPatients(): void {
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
    this.activeTab='sante'
  }

  // ── Ajouter un patient ────────────────────────────
 ajouterP(form: NgForm): void {
 
  // ── 1. INFOS PERSONNELLES ───────────────────────
  if (!this.nom?.trim()) {
    alert('⚠️ Le nom est obligatoire.');
    this.activeTab = 'info';
    return;
  }
 
  if (!this.prenom?.trim()) {
    alert('⚠️ Le prénom est obligatoire.');
    this.activeTab = 'info';
    return;
  }
 
  const age = parseFloat(this.age);
  if (!this.age || age < 1 || age > 120) {
    alert('⚠️ Veuillez saisir un âge valide (1 – 120).');
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
  if (!this.tel?.trim() || !telRegex.test(this.tel.trim()) || this.tel.trim().length < 8) {
    alert('⚠️ Veuillez saisir un numéro de téléphone valide.');
    this.activeTab = 'info';
    return;
  }
 
  if (!this.adress?.trim()) {
    alert('⚠️ L\'adresse est obligatoire.');
    this.activeTab = 'info';
    return;
  }
 
  // ── 2. DONNÉES DE SANTÉ ─────────────────────────
  const taille = parseFloat(this.Taille);
  if (!this.Taille || taille < 50 || taille > 250) {
    alert('⚠️ Veuillez saisir une taille valide (50 – 250 cm).');
    this.activeTab = 'sante';
    return;
  }
 
  const poids = parseFloat(this.poids_actuiele);
  if (!this.poids_actuiele || poids < 10 || poids > 300) {
    alert('⚠️ Veuillez saisir un poids valide (10 – 300 kg).');
    this.activeTab = 'sante';
    return;
  }
 
  if (!this.Allergie?.trim()) {
    alert('⚠️ Veuillez renseigner les allergies (ou "Aucune").');
    this.activeTab = 'sante';
    return;
  }
 
  if (!this.Conditions_me?.trim()) {
    alert('⚠️ Veuillez renseigner les conditions médicales (ou "Aucune").');
    this.activeTab = 'sante';
    return;
  }
 
  // ── 3. ACTIVITÉ & OBJECTIF ──────────────────────
  if (!this.niveau_act) {
    alert('⚠️ Veuillez sélectionner un niveau d\'activité.');
    this.activeTab = 'activite';
    return;
  }
 
  if (!this.objectif) {
    alert('⚠️ Veuillez sélectionner un objectif nutritionnel.');
    this.activeTab = 'activite';
    return;
  }
 
  if (!this.description?.trim()) {
    alert('⚠️ Veuillez saisir une description / plan.');
    this.activeTab = 'activite';
    return;
  }
 
  // ── 4. TOUT EST VALIDE → APPEL SERVICE ─────────
  this.svc.ajouterpatient(
    this.nom,
    this.prenom,
    this.age,
    this.sexe,
    this.email,
    this.password,
    this.tel,
    this.adress,
    this.note_interne,
    this.Taille,
    this.poids_actuiele,
    this.Allergie,
    this.Conditions_me,
    this.niveau_act,
    this.objectif,
    this.description
  ).subscribe({
    next: () => {
      alert('✅ Patient ajouté avec succès !');
      form.reset();
      this.resetChamps();
      this.activeTab = 'info';
      this.closeForm();
      this.filterPatients();
    },
    error: (err) => {
      console.error('Erreur ajout patient :', err);
      alert('❌ Une erreur est survenue. Veuillez réessayer.');
    }
  });
}
  openForm(): void {
    this.showForm  = true;
    this.activeTab = 'info';
  }

  closeForm(): void {
    this.showForm = false;
  }

  onOverlayClick(event: MouseEvent): void {
    // Ferme la modal si on clique sur le fond (pas sur la boîte)
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeForm();
    }
  }
  // ── Helpers statistiques ──────────────────────────
  countBySexe(sexe: string): number {
    return (this.fifi ?? []).filter(p => p.genre === sexe).length;
  }

  countWithObjectif(): number {
    return (this.fifi ?? []).filter(p => p.objectif && p.objectif !== 'Non défini').length;
  }
  x: number = 0;
  calcIMC(poids_actuiele: any, taille: any): string {
    const p = parseFloat(poids_actuiele);
    const t = parseFloat(taille);
    if (!p || !t || t === 0) {
      return '—';
    } else {
      this.x = parseFloat((p / ((t / 100) ** 2)).toFixed(1));
      return this.x.toString();
    }
  }
  suppprimer(id: number){
    this.svc.supppatient(id).subscribe({
      next: () => {
        alert('✅ Patient supprimé avec succès !');

        // Rafraîchir la liste après suppression
        this.getPatients();
      }
    });
  }
  // ── Reset interne des champs ──────────────────────
  private resetChamps(): void {
    this.nom           = '';
    this.prenom        = '';
    this.age           = '';
    this.sexe          = '';
    this.email         = '';
    this.tel           = '';
    this.adress        = '';
    this.note_interne  = '';
    this.Taille        = '';
    this.poids_actuiele = '';
    this.Allergie      = '';
    this.Conditions_me = '';
    this.niveau_act    = '';
    this.objectif      = '';
    this.description   = '';
  }

 
fifi: any[] = [];

ngOnInit() {
  this.getPatients();
}

getPatients() {
  this.svc.getallPatients().subscribe({
    next: (res: any) => {
      this.fifi = res.personnes;
    },
    error: (err) => {
      console.error("Erreur chargement patients", err);
    }
  });
}
selectedIndex: number | null = null;

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
      alert('Erreur lors de l\'accès');
    }
  })
}
}
