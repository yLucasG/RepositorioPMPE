import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { DetalheTrabalhoComponent } from './detalhe-trabalho/detalhe-trabalho';
import { LoginComponent } from './admin/login/login';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { NovoComponent } from './admin/novo/novo';
import { LoteComponent } from './admin/lote/lote';
import { EditarComponent } from './admin/editar/editar';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'trabalho/:id', component: DetalheTrabalhoComponent },
  { path: 'admin/login', component: LoginComponent },
  { path: 'admin', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin/novo', component: NovoComponent, canActivate: [authGuard] },
  { path: 'admin/lote', component: LoteComponent, canActivate: [authGuard] },
  { path: 'admin/editar/:id', component: EditarComponent, canActivate: [authGuard] },
];
