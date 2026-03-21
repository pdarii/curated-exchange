import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  unreadCount = signal(0);

  readonly navLinks = [
    { label: 'Assets', route: '/dashboard' },
    { label: 'Market', route: '/market' },
    { label: 'Trades', route: '/trades' },
    { label: 'Analysis', route: '/analysis' },
  ];

  constructor(
    public auth: AuthService,
    private socket: SocketService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.socket.connect(user.id);
    }

    this.socket
      .onNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.unreadCount.update((n) => n + 1));
  }

  logout(): void {
    this.auth.logout();
  }
}
