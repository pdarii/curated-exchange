import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'assets',
        loadComponent: () => import('./pages/assets/assets').then((m) => m.Assets),
      },
      {
        path: 'assets/:id',
        loadComponent: () => import('./pages/asset-detail/asset-detail').then((m) => m.AssetDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
