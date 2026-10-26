import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthComponent } from './auth.component';
import { authGuard, guestGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'login', component: AuthComponent, canActivate: [guestGuard], data: { mode: 'login' } },
  { path: 'register', component: AuthComponent, canActivate: [guestGuard], data: { mode: 'register' } },
  { path: '**', redirectTo: '' },
];
