import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { PatientC} from './patient/patient';
import { authGuard } from './auth-guard';
import { Acceuil } from './acceuil/acceuil';
import { Createacc } from './createacc/createacc';
import { Rdv } from './rdv/rdv';
import { Espacep } from './espacep/espacep';
import { Rdvp } from './rdvp/rdvp';
import { Profil } from './profil/profil';
import { CallbackComponent } from './callback/callback.component'
import { ForgotPassword } from './forgot-password/forgot-password';
export const routes: Routes = [
  {path: 'forgot-password', component: ForgotPassword},
   { path: 'callback', component: CallbackComponent },
  { path: '', component: Acceuil },
   { path: 'createacc', component: Createacc },
  { path: 'login', component: Login },
  {path: 'dashboard',component: Dashboard, 
    children:[
         {path:'patient', component:PatientC},
         {path:'rdv',component:Rdv}
             ]
},
{path:'escpacep', component:Espacep,
  children:[
    {path:'rdvp', component:Rdvp},
    {path:'profil',component:Profil}
  ]
}

]
