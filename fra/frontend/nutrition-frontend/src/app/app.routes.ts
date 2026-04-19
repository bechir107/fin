import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { PatientC} from './patient/patient';
import { authGuard } from './auth-guard';
import { Acceuil } from './acceuil/acceuil';
import { Rdv } from './rdv/rdv';
import { Espacep } from './espacep/espacep';
import { Rdvp } from './rdvp/rdvp';
import { Profil } from './profil/profil';
import { Progress } from './progress/progress';

export const routes: Routes = [
  { path: '', component: Acceuil },
  { path: 'login', component: Login },
  {path: 'dashboard',component: Dashboard, 
    children:[
         {path:'patient', component:PatientC},
         {path:'rdv',component:Rdv},
         {path:'progress',component:Progress}
             ]
},
{path:'escpacep', component:Espacep,
  children:[
    {path:'rdvp', component:Rdvp},
    {path:'profil',component:Profil}
  ]
}

]
