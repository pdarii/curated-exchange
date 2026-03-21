import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  readonly navLinks = [
    { label: 'Dashboard', route: '/admin' },
    { label: 'Settings', route: '/admin/settings' },
  ];

  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
