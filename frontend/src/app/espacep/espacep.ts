import { Component } from '@angular/core';
import { Service } from '../nut/service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-espacep',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './espacep.html',
  styleUrl: './espacep.css',
})
export class Espacep {
   nom="";
   prenom="";


  constructor(private service: Service, private router: Router) {}
  ngOnInit() {

 const user = this.service.cuurrentUser;
 
    if (user) {
      this.nom    = user.nom;
      this.prenom = user.prenom;
     
}
 console.log('Utilisateur connecté :', this.nom, this.prenom);
  }
}


