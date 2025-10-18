import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { TasksComponent } from './pages/tasks/tasks.component';

export const APP_ROUTES: Routes = [
  // Login page: only if you're NOT logged in
  { path: 'login', canActivate: [loginGuard], component: LoginComponent },

  // Main board (edit allowed for Admin/Owner)
  { path: '', canActivate: [authGuard], component: TasksComponent },

  // Viewer board (read-only); TasksComponent can read route data.readOnly
  { path: 'viewer', canActivate: [authGuard], component: TasksComponent, data: { readOnly: true } },

  // Anything else -> go to login first
  { path: '**', redirectTo: 'login' },
];
