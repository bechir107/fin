import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class Service {

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object  // ✅ détecte browser vs serveur
  ) { }

  errorMsg: String = '';

  // ✅ Getter sécurisé SSR
  get cuurrentUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  // ✅ Setter sécurisé SSR
  set cuurrentUser(user: any) {
    if (isPlatformBrowser(this.platformId)) {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }

  // ✅ Logout
  logout() {
    this.cuurrentUser = null;
    this.router.navigate(['/login']);
  }

  login(email: string, password: string) {
    return this.http.post('http://127.0.0.1:5000/login', { email, password }).pipe(
      tap((response: any) => {
        this.cuurrentUser = response;
      })
    );
  }

  loginNut(email: string, password: string) {
    return this.http.post('http://127.0.0.1:5000/loginNut', { email, password }).pipe(
      tap((response: any) => {
        this.cuurrentUser = response;
      })
    );
  }

  supprdv(id: Number) {
    return this.http.get<Int16Array[]>(`http://127.0.0.1:5000/supprdv/${id}`);
  }

  accepterRdv(id: number) {
    return this.http.put(`http://127.0.0.1:5000/accepter_rdv/${id}`, {});
  }

  supppatient(idp: number) {
    return this.http.get<Int16Array[]>(`http://127.0.0.1:5000/suppatient/${idp}`);
  }

  getPatients() {
    return this.http.get<any>('http://127.0.0.1:5000/patient');
  }

  saveDisponibilites(disponibilites: any) {
    return this.http.post('http://127.0.0.1:5000/disponibilites', { disponibilites });
  }

  getDisponibilites() {
    return this.http.get<any>('http://127.0.0.1:5000/disponibilites');
  }

  rondv(nom: string, prenom: string, email: string, date: string, hrdv: string) {
    return this.http.post('http://127.0.0.1:5000/prendrerdv', { nom, prenom, email, date, hrdv });
  }

  accesP(email: string) {
    return this.http.get(`http://127.0.0.1:5000/accesP/${email}`);
  }

  getId(id: number) {
    return this.http.get(`http://127.0.0.1:5000/getId/${id}`);
  }

  getHeures(date: string): Observable<any> {
    return this.http.get(`http://localhost:5000/heures/${date}`);
  }

  ajouterpatient(nom: string, prenom: string, age: string, sexe: string, email: string, password: string, tel: string, adress: string, note_interne: string, taille: string, poids_actuiele: string, allergie: string, Conditions_me: string, niveau_act: string, objectif: string, description: string): Observable<any> {
    return this.http.post(`http://127.0.0.1:5000/ajoutep`, { nom, prenom, age, sexe, email, password, tel, adress, note_interne, taille, poids_actuiele, allergie, Conditions_me, niveau_act, objectif, description });
  }

  getPatient(chercher: string) {
    return this.http.get<string[]>(`http://127.0.0.1:5000/patientex/${chercher}`);
  }

  getallPatients() {
    return this.http.get<any>(`http://127.0.0.1:5000/allpatient`);
  }

  getDisponibilite(): Observable<any> {
    return this.http.get('http://localhost:5000/disponibilite');
  }

  saveDisponibilite(slots: any[]): Observable<any> {
    return this.http.post('http://localhost:5000/disponibilite', slots);
  }
  updatePassword(id: number, newpasswrod: string) {
    return this.http.put(`http://127.0.0.1:5000/upmdp/${id}`, { newpasswrod });
  }
}