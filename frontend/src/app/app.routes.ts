import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { PatientC } from './patient/patient';
import { authGuard } from './auth-guard';
import { Acceuil } from './acceuil/acceuil';
import { Createacc } from './createacc/createacc';
import { Rdv } from './rdv/rdv';
import { Espacep } from './espacep/espacep';
import { Rdvp } from './rdvp/rdvp';
import { Profil } from './profil/profil';
import { Profilnutri } from './profilnutri/profilnutri';
import { CallbackComponent } from './callback/callback.component';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ChatFab } from './chat-fab/chat-fab';
import { Calculateur } from './calculateur/calculateur';
import { Stats } from './stats/stats';
import { Stat } from './stat/stat';
import { Consultation } from './consultation/consultation';
import { Patientrdv } from './patientrdv/patientrdv';
import { Calendrier } from './calendrier/calendrier';
import { AjouterPatient } from './ajouterpatient/ajouterpatient';
export const routes: Routes = [
  // --- ROUTES PUBLIQUES ---
  { path: '', component: Acceuil },
  { path: 'login', component: Login },
  { path: 'createacc', component: Createacc },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'callback', component: CallbackComponent },
  { path: 'calculateur', component: Calculateur },
  { path: 'chat', component: ChatFab },

  // --- ESPACE NUTRITIONNISTE (DASHBOARD) ---
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      /** 
       * CRUCIAL : Redirection automatique vers /dashboard/stats 
       * quand on accède simplement à /dashboard
       */
      { path: '', redirectTo: 'stats', pathMatch: 'full' }, 
      { path: 'stats', component: Stats },
      { path: 'patient', component: PatientC },
      { path: 'stat', component: Stat },
      { path: 'consultation', component: Consultation },
      { path: 'rdv', component: Rdv },
      { path: 'calendrier', component: Calendrier },
      { path: 'ajouterpatient', component: AjouterPatient },
      
    ]
  },

  // --- ESPACE PATIENT (ESPACEP) ---
  {
    path: 'espacep',
    component: Espacep,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'rdvp', pathMatch: 'full' },
      { path: 'rdvp', component: Rdvp },
      { path: 'profil', component: Profil },
      { path: 'profilnutri', component: Profilnutri },
      { path: 'patientrdv', component: Patientrdv },
    ]
  },

  // --- GESTION DES ERREURS ---
  // Redirige vers l'accueil si l'URL saisie est inconnue
  { path: '**', redirectTo: '' } 
];