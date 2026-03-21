import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Pet, Listing, Bid, Notification } from '../../models/domain';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  traderName = signal('');
  availableCash = signal(0);
  lockedCash = signal(0);
  totalPortfolioValue = signal(0);
  pets = signal<Pet[]>([]);
  listings = signal<Listing[]>([]);
  bids = signal<Bid[]>([]);
  notifications = signal<Notification[]>([]);

  private traderId = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private socket: SocketService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.traderId = user.id;
    this.traderName.set(user.name);

    this.api.getTraderPortfolio(this.traderId).subscribe((p) => {
      this.availableCash.set(p.availableCash);
      this.lockedCash.set(p.lockedCash);
      this.totalPortfolioValue.set(p.totalPortfolioValue);
      this.pets.set(p.pets);
      this.listings.set(p.listings);
      this.bids.set(p.bids);
    });

    this.api.getNotifications(this.traderId).subscribe((n) => this.notifications.set(n));

    // Real-time pet stats
    this.socket
      .onPetStatsUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.pets.update((pets) =>
          pets.map((pet) => {
            const tick = event.pets.find((p) => p.id === pet.id);
            return tick ? { ...pet, ...tick } : pet;
          }),
        );
        const petsValue = this.pets().reduce((s, p) => s + p.intrinsicValue, 0);
        this.totalPortfolioValue.set(this.availableCash() + this.lockedCash() + petsValue);
      });

    // Real-time notifications
    this.socket
      .onNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        if (e.notification.traderId === this.traderId) {
          this.notifications.update((list) => [e.notification, ...list]);
        }
      });
  }

  isListed(petId: string): boolean {
    return this.listings().some((l) => l.petId === petId);
  }

  getListingPrice(petId: string): number | null {
    return this.listings().find((l) => l.petId === petId)?.askingPrice ?? null;
  }

  healthColor(health: number): string {
    if (health > 70) return 'primary';
    if (health > 40) return 'accent';
    return 'warn';
  }

  timeAgo(dateStr: string): string {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs} hr ago` : `${Math.floor(hrs / 24)}d ago`;
  }

  notifIcon(type: string): string {
    const map: Record<string, string> = {
      bid_received: 'gavel',
      bid_accepted: 'check_circle',
      bid_rejected: 'cancel',
      bid_outbid: 'trending_up',
      pet_purchased: 'shopping_cart',
      pet_sold: 'sell',
    };
    return map[type] ?? 'info';
  }
}
