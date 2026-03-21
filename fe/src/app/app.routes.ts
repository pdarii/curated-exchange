import { Routes } from '@angular/router';
import { authGuard, traderGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard) },
      { path: 'settings', loadComponent: () => import('./pages/admin-settings/admin-settings').then((m) => m.AdminSettings) },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, traderGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'market', loadComponent: () => import('./pages/market/market').then((m) => m.Market) },
      { path: 'catalog', loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog) },
      { path: 'assets', loadComponent: () => import('./pages/assets/assets').then((m) => m.Assets) },
      { path: 'assets/:id', loadComponent: () => import('./pages/asset-detail/asset-detail').then((m) => m.AssetDetail) },
      { path: 'assets/:id/history', loadComponent: () => import('./pages/trade-history/trade-history').then((m) => m.TradeHistory) },
    ],
  },
  { path: '**', redirectTo: '' },
];
