import { HttpClient } from '@angular/common/http';
import { Component, NgModule } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { error } from 'console';
import { Service } from '../nut/service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-rdvp',
  imports: [FormsModule,CommonModule],
  templateUrl: './rdvp.html',
  styleUrl: './rdvp.css',
})
export class Rdvp {
  constructor(private service:Service, http:HttpClient){}
  nom=""
  prenom=""
  email=""
  date=""
  hrdv=""
 heuresPrises: any[] = [];


prendreRdv(){
   if(this.nom==""|| this.prenom==""||this.email==""||this.date==""||this.hrdv==""){
    alert('champs vide')
   }
  
  else if (isNaN(parseInt(this.hrdv['0'])) || isNaN(parseInt(this.hrdv['1'])))
    {
      alert("heure invaldde")
    return;
  }

   else{
   this.service.rondv(this.nom,this.prenom,this.email,this.date,this.hrdv)
       .subscribe({
    next: (res) => {
      alert((res as any).message);
      this.nom="";
      this.prenom="";
      this.email="";
      this.date="";
      this.hrdv="";
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de la réservation');
    }
  });

   }
  }

chargerHeures(){
  this.service.getHeures(this.date).subscribe((res:any) => {
    this.heuresPrises = res;
  
  });
}
}





