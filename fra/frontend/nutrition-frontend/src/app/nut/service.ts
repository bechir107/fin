import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { email } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { error } from 'console';
import { catchError, Observable, throwError, timeout } from 'rxjs'; // ✅ timeout importé ici

@Injectable({
  providedIn: 'root',
})
export class Service {
  supprdv(id: Number) {
    return this.http.get<Int16Array[]>(`http://127.0.0.1:5000/supprdv/${id}`);
  }



  constructor(private http: HttpClient, private router: Router) { }
  errorMsg: String = '';
  cuurrentUser: any = null;
  supppatient(idp: number) {
    return this.http.get<Int16Array[]>(`http://127.0.0.1:5000/suppatient/${idp}`);

  }

  login(email: string, password: string) {
    return this.http.post('http://127.0.0.1:5000/login', { email, password });
  }

  getPatients() {
    return this.http.get<any>('http://127.0.0.1:5000/patient');
  }
  saveDisponibilites(disponibilites: any) {
    return this.http.post('http://127.0.0.1:5000/disponibilites', { disponibilites });
  }

  // Récupérer les disponibilités
  getDisponibilites() {
    return this.http.get<any>('http://127.0.0.1:5000/disponibilites');
  }

  rondv(nom: string, prenom: string, email: string, date: string, hrdv: string) {
    return this.http.post('http://127.0.0.1:5000/prendrerdv', { nom, prenom, email, date, hrdv })

  }
  accesP(email: string) {
    return this.http.get(`http://127.0.0.1:5000/accesP/${email}`);
  }



  getHeures(datehdv: string) {
    return this.http.get<string[]>(`http://127.0.0.1:5000/heures/${datehdv}`);
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
  loginNut(email: string, password: string) {
    return this.http.post(`http://127.0.0.1:5000/loginNut`, { email, password })
  }
}

