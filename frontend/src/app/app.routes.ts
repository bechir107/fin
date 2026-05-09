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
import { ChatFab } from './chat-fab/chat-fab';
import { Calculateur } from './calculateur/calculateur';
import { Stats } from './stats/stats';
import { Consultation } from './consultation/consultation';
export const routes: Routes = [
  {path: 'forgot-password', component: ForgotPassword},
   { path: 'callback', component: CallbackComponent },
  { path: '', component: Acceuil },
   { path: 'createacc', component: Createacc },
  { path: 'login', component: Login },
  { path: 'calculateur', component: Calculateur },
  {path:'chat', component: ChatFab},
  {path: 'dashboard',component: Dashboard, 
    children:[
         {path:'patient', component:PatientC},
         {path:'rdv',component:Rdv},
         {path:'stats', component:Stats},
         {path:'consultation', component:Consultation}
             ]
},
{path:'escpacep', component:Espacep,
  children:[
    {path:'rdvp', component:Rdvp},
    {path:'profil',component:Profil}
  ]
}

]
