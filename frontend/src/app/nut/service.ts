import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Service {



  constructor(private http: HttpClient, private router: Router) {}
  errorMsg: String = '';
  cuurrentUser: any = null;
  supppatient(idp: number) {
     return this.http.get<string[]>(`http://127.0.0.1:5000/supppatient/${idp}`);
   
  }

  login(email: string, password: string) {
    return this.http.post('http://127.0.0.1:5000/login', { email, password });
  }

  getPatients() {
    return this.http.get<any>('http://127.0.0.1:5000/patient');
  } 

  rondv(nom:string,prenom:string,email:string,date:string,hrdv:string){
   return this.http.post('http://127.0.0.1:5000/prendrerdv',{nom,prenom,email,date,hrdv});
  }

  supprdv(id: number) {
    return this.http.get(`http://127.0.0.1:5000/supprdv/${id}`);
  }

  accepterRdv(id: number) {
    return this.http.put(`http://127.0.0.1:5000/accepter_rdv/${id}`, {});
  }

  getDisponibilite() {
    return this.http.get<any[]>('http://127.0.0.1:5000/disponibilite');
  }

  saveDisponibilite(slots: any[]) {
    return this.http.post('http://127.0.0.1:5000/disponibilite', slots);
  }

  accesP(email: string) {
    return this.http.get(`http://127.0.0.1:5000/accesP/${email}`);
}

  getUserProfile(email: string) {
    return this.http.get<any>(`http://127.0.0.1:5000/me/${email}`);
  }
getHeures(datehdv: string){
  return this.http.get<string[]>(`http://127.0.0.1:5000/heures/${datehdv}`);
}

getPatientsDropdown() {
  return this.http.get<any[]>('http://127.0.0.1:5000/api/patients');
}

getAvailableSlots(date: string) {
  return this.http.get<string[]>(`http://127.0.0.1:5000/api/available-slots/${date}`);
}

createAppointment(id_patient: number, date_rendez_vous: string, heure: string, id_nutritionniste: number = 1) {
  return this.http.post('http://127.0.0.1:5000/api/appointments', {
    id_patient,
    date_rendez_vous,
    heure,
    id_nutritionniste
  });
}
  modifierPatient(data: any): Observable<any> {
    return this.http.post('http://127.0.0.1:5000/updateProfile', data);
  }

  ajouterPatientSimple(nom: string, prenom: string, email: string, telephone: string): Observable<any> {
    return this.http.post('http://127.0.0.1:5000/api/patient/simple', { nom, prenom, email, telephone });
  }

  ajouterpatient(nom: string, prenom: string, ddn: string, sexe: string, email: string, password: string, telephone: string, adresse: string, allergie: string, maladie_chronique: string, objectif: string, ddc: string): Observable<any> {
    return this.http.post(`http://127.0.0.1:5000/createPatient`, {
      nom, prenom, ddn, sexe, email, password, telephone, adresse, allergie, maladie_chronique, objectif, ddc
    });
  }
  getPatient(chercher:string){
     return this.http.get<string[]>(`http://127.0.0.1:5000/patientex/${chercher}`);
  }
 getallPatients(){
  return this.http.get<any>(`http://127.0.0.1:5000/allpatient`);
}
 loginNut(email: string, password: string) {
       return this.http.post(`http://127.0.0.1:5000/loginNut`, { email, password })}
}

