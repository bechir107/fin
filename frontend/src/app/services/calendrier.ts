import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendrierService {
  // L'URL de votre API Flask (à ajuster selon votre configuration)
  private apiUrl = 'http://localhost:5000/api'; 

  constructor(private http: HttpClient) { }

  // Exemple : Récupérer tous les rendez-vous
  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rendez-vous`);
  }

  // Exemple : Récupérer les disponibilités
  getDisponibilites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/disponibilites`);
  }

  // Exemple : Ajouter un rendez-vous
  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rendez-vous`, appointmentData);
  }
}