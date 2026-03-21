import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface Trader {
  id: string;
  name: string;
  role: 'trader' | 'admin';
}

const MOCK_TRADERS: Record<string, Trader> = {
  alice: { id: 'trader-a', name: 'Alice', role: 'trader' },
  bob: { id: 'trader-b', name: 'Bob', role: 'trader' },
  charlie: { id: 'trader-c', name: 'Charlie', role: 'trader' },
  admin: { id: 'admin', name: 'Admin', role: 'admin' },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<Trader | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private router: Router) {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(username: string, _password: string): boolean {
    const key = username.toLowerCase().split('@')[0];
    const trader = MOCK_TRADERS[key];
    if (trader) {
      this.currentUser.set(trader);
      sessionStorage.setItem('currentUser', JSON.stringify(trader));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
