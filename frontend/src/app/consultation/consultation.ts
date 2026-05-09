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

  getById(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.base}/${id}`);
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

  constructor(private fb: FormBuilder, private service: ConsultationService) {
    this.form = this.fb.group({
      id_consultation: [null],
      id_rendez_vous: [null, [Validators.required, Validators.min(1)]],
      date_consultation: ['', Validators.required],
      poids: [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      tension_arterielle: [''],
      glycemie: [''],
      diagnostic: [''],
      remarque: ['']
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadData();
  }

  loadStats() {
    this.service.getStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error(err)
    });
  }

  loadData() {
    this.loading = true;
    this.service.getAll({
      page: this.page,
      per_page: 10,
      search: this.searchQuery,
      diagnostic: this.filterDiag
    }).subscribe({
      next: (res) => {
        this.consultations = res.data || [];
        this.total = res.total || 0;
        this.totalPages = res.pages || 1;
        this.pages = Array.from({length: this.totalPages}, (_, i) => i + 1);
        this.loading = false;
      },
      error: (err) => {
        this.showToast('Erreur de chargement', 'error');
        this.loading = false;
      }
    });
  }

  trackById(index: number, c: Consultation) {
    return c.id_consultation;
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

  onSearch(val: string) {
    this.searchQuery = val;
    this.page = 1;
    this.loadData();
  }

  onFilterDiag(val: string) {
    this.filterDiag = val;
    this.page = 1;
    this.loadData();
  }

  openCreate() {
    this.isEditing = false;
    this.form.reset();
    this.showModal = true;
  }

  openEdit(c: Consultation) {
    this.isEditing = true;
    this.form.patchValue(c);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  field(name: string) {
    return this.form.get(name);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    
    if (this.isEditing && val.id_consultation) {
      this.service.update(val.id_consultation, val).subscribe({
        next: () => {
          this.showToast('Consultation modifiée', 'success');
          this.closeModal();
          this.loadData();
          this.loadStats();
          this.saving = false;
        },
        error: () => {
          this.showToast('Erreur lors de la modification', 'error');
          this.saving = false;
        }
      });
    } else {
      this.service.create(val).subscribe({
        next: () => {
          this.showToast('Consultation ajoutée', 'success');
          this.closeModal();
          this.loadData();
          this.loadStats();
          this.saving = false;
        },
        error: () => {
          this.showToast('Erreur lors de l\'ajout', 'error');
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(c: Consultation) {
    this.deleteTarget = c;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  doDelete() {
    if (!this.deleteTarget?.id_consultation) return;
    this.service.delete(this.deleteTarget.id_consultation).subscribe({
      next: () => {
        this.showToast('Consultation supprimée', 'success');
        this.cancelDelete();
        this.loadData();
        this.loadStats();
      },
      error: () => {
        this.showToast('Erreur lors de la suppression', 'error');
        this.cancelDelete();
      }
    });
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadData();
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toast = { msg, type };
    setTimeout(() => {
      if (this.toast?.msg === msg) this.toast = null;
    }, 3000);
  }
}