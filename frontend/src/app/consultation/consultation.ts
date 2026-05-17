import { Component, OnInit, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// --- Models ---
export interface Consultation {
  id_consultation?: number;
  id_rendez_vous: number;
  date_consultation: string;
  poids: number;
  tension_arterielle?: string;
  glycemie?: string;
  diagnostic?: string;
  remarque?: string;
  nom?: string;
  prenom?: string;
  id_patient?: number;
}

export interface ConsultationPage {
  data: Consultation[];
  total: number;
  page: number;
  pages: number;
}

export interface ConsultationStats {
  total: number;
  poids_moyen: number;
  par_diagnostic: { label: string; count: number }[];
}

// --- Service ---
@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private base = 'http://127.0.0.1:5000/consultations';

  constructor(private http: HttpClient) { }

  getAll(params: { page?: number; per_page?: number; search?: string; diagnostic?: string }): Observable<ConsultationPage> {
    let p = new HttpParams();
    if (params.page) p = p.set('page', params.page);
    if (params.per_page) p = p.set('per_page', params.per_page);
    if (params.search) p = p.set('search', params.search);
    if (params.diagnostic) p = p.set('diagnostic', params.diagnostic);
    return this.http.get<ConsultationPage>(this.base, { params: p });
  }

  create(c: Consultation): Observable<Consultation> {
    return this.http.post<Consultation>(this.base, c);
  }

  update(id: number, c: Consultation): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.base}/${id}`, c);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  getStats(): Observable<ConsultationStats> {
    return this.http.get<ConsultationStats>(`${this.base}/stats`);
  }

  getPatients(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:5000/allpatient');
  }

  getPatientById(id: number): Observable<any> {
    return this.http.get<any>(`http://127.0.0.1:5000/patient/${id}`);
  }

  getConsultationsByPatient(id: number): Observable<any> {
    return this.http.get<any>(`http://127.0.0.1:5000/api/consultations/patient/${id}`);
  }
}

// --- Component ---
@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css'
})
export class Consultation implements OnInit {
  stats: ConsultationStats | null = null;
  total = 0;
  diagnostics = ['diabète', 'hypertension', 'obésité', 'dénutrition', 'normal'];
  loading = false;
  consultations: Consultation[] = [];
  totalPages = 1;
  page = 1;
  pages: number[] = [1];

  showModal = false;
  isEditing = false;
  form: FormGroup;
  saving = false;

  showDeleteModal = false;
  deleteTarget: Consultation | null = null;
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  searchQuery = '';
  filterDiag = '';

  // Dossier patient
  showDossier = false;
  dossierPatient: any = null;
  dossierConsultations: Consultation[] = [];
  loadingDossier = false;
  minimizedCardIds = new Set<number>();

  // Patient search state
  patientList: any[] = [];
  filteredPatients: any[] = [];
  patientSearch = '';
  showPatientDropdown = false;
  selectedPatient: any = null;

  constructor(private fb: FormBuilder, private service: ConsultationService) {
    this.form = this.fb.group({
      id_consultation:   [null],
      id_patient:        [null],
      nom:               [''],
      prenom:            [''],
      id_rendez_vous:    [null, [Validators.required, Validators.min(1)]],
      date_consultation: ['', Validators.required],
      poids:             [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      tension_arterielle:[''],
      glycemie:          [''],
      diagnostic:        [''],
      remarque:          ['']
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadData();
    this.loadPatients();
  }

  // ── Patients ───────────────────────────────────────
  loadPatients() {
    this.service.getPatients().subscribe({
      next: (res: any) => { this.patientList = res.patients || res.personnes || []; },
      error: () => {}
    });
  }

  onPatientSearch(val: string) {
    this.patientSearch = val;
    const q = val.toLowerCase().trim();
    this.filteredPatients = (q
      ? this.patientList.filter(p => (p.prenom + ' ' + p.nom).toLowerCase().includes(q))
      : this.patientList
    ).slice(0, 8);
    this.showPatientDropdown = true;
  }

  showAllPatients() {
    this.filteredPatients = this.patientList.slice(0, 8);
    this.showPatientDropdown = true;
  }

  selectPatient(p: any) {
    this.selectedPatient = p;
    this.form.patchValue({ id_patient: p.id_patient, nom: p.nom, prenom: p.prenom });
    this.patientSearch = '';
    this.showPatientDropdown = false;
  }

  clearPatient() {
    this.selectedPatient = null;
    this.form.patchValue({ id_patient: null, nom: '', prenom: '' });
    this.patientSearch = '';
    this.filteredPatients = [];
    this.showPatientDropdown = false;
  }

  closeDropdownDelayed() {
    setTimeout(() => { this.showPatientDropdown = false; }, 200);
  }

  // ── Consultations ──────────────────────────────────
  loadStats() {
    this.service.getStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error(err)
    });
  }

  loadData() {
    this.loading = true;
    this.service.getAll({
      page: this.page, per_page: 10,
      search: this.searchQuery, diagnostic: this.filterDiag
    }).subscribe({
      next: (res) => {
        this.consultations = res.data || [];
        this.total = res.total || 0;
        this.totalPages = res.pages || 1;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.loading = false;
      },
      error: () => { this.showToast('Erreur de chargement', 'error'); this.loading = false; }
    });
  }

  trackById(_: number, c: Consultation) { return c.id_consultation; }
  trackByRdv(_: number, g: any) { return g.id_rendez_vous; }

  get groupedConsultations(): Array<{ id_rendez_vous: number; nom: string|undefined; prenom: string|undefined; id_patient: number|undefined; items: Consultation[] }> {
    const map = new Map<number, any>();
    for (const c of this.consultations) {
      const key = c.id_rendez_vous;
      if (!map.has(key)) {
        map.set(key, { id_rendez_vous: key, nom: c.nom, prenom: c.prenom, id_patient: c.id_patient, items: [] });
      }
      map.get(key)!.items.push(c);
    }
    return Array.from(map.values());
  }

  imcClass(poids: number) {
    if (!poids) return 'badge-gray';
    if (poids > 90) return 'badge-red';
    if (poids > 75) return 'badge-amber';
    return 'badge-green';
  }

  imcLabel(poids: number) {
    if (!poids) return 'N/A';
    if (poids > 90) return 'Surpoids';
    if (poids > 75) return 'Attention';
    return 'Normal';
  }

  diagClass(diag: string | undefined) {
    if (!diag) return 'badge-gray';
    const d = diag.toLowerCase();
    if (d.includes('diabète') || d.includes('hyper')) return 'badge-red';
    if (d.includes('obésité') || d.includes('dénutrition')) return 'badge-amber';
    return 'badge-blue';
  }

  voirDossier(g: any) {
    const c: Consultation = g.items[0];
    if (!c.id_patient) return;
    this.minimizedCardIds.add(g.id_rendez_vous);
    this.showDossier = true;
    this.loadingDossier = true;
    this.dossierPatient = { nom: c.nom, prenom: c.prenom, id_patient: c.id_patient };
    this.dossierConsultations = [];

    this.service.getPatientById(c.id_patient).subscribe({
      next: (p) => { this.dossierPatient = p; },
      error: () => {}
    });

    this.service.getConsultationsByPatient(c.id_patient).subscribe({
      next: (res: any) => { this.dossierConsultations = res.consultations || []; this.loadingDossier = false; },
      error: () => { this.loadingDossier = false; }
    });
  }

  closeDossier() {
    this.showDossier = false;
    this.dossierPatient = null;
    this.dossierConsultations = [];
    this.minimizedCardIds.clear();
  }

  onSearch(val: string) { this.searchQuery = val; this.page = 1; this.loadData(); }
  onFilterDiag(val: string) { this.filterDiag = val; this.page = 1; this.loadData(); }

  openCreate() {
    this.isEditing = false;
    this.form.reset();
    this.selectedPatient = null;
    this.patientSearch = '';
    this.filteredPatients = [];
    this.showPatientDropdown = false;
    this.showModal = true;
  }

  openEdit(c: Consultation) {
    this.isEditing = true;
    this.form.patchValue(c);
    this.selectedPatient = (c.nom || c.prenom)
      ? { id: c.id_patient, nom: c.nom, prenom: c.prenom }
      : null;
    this.patientSearch = '';
    this.showPatientDropdown = false;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  field(name: string) { return this.form.get(name); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val = this.form.value;

    const req = this.isEditing && val.id_consultation
      ? this.service.update(val.id_consultation, val)
      : this.service.create(val);

    req.subscribe({
      next: () => {
        this.showToast(this.isEditing ? 'Consultation modifiée' : 'Consultation ajoutée', 'success');
        this.closeModal();
        this.loadData();
        this.loadStats();
        this.saving = false;
      },
      error: () => {
        this.showToast('Erreur lors de l\'enregistrement', 'error');
        this.saving = false;
      }
    });
  }

  confirmDelete(c: Consultation) { this.deleteTarget = c; this.showDeleteModal = true; }
  cancelDelete() { this.showDeleteModal = false; this.deleteTarget = null; }

  doDelete() {
    if (!this.deleteTarget?.id_consultation) return;
    this.service.delete(this.deleteTarget.id_consultation).subscribe({
      next: () => { this.showToast('Consultation supprimée', 'success'); this.cancelDelete(); this.loadData(); this.loadStats(); },
      error: () => { this.showToast('Erreur lors de la suppression', 'error'); this.cancelDelete(); }
    });
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadData();
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toast = { msg, type };
    setTimeout(() => { if (this.toast?.msg === msg) this.toast = null; }, 3000);
  }
}
