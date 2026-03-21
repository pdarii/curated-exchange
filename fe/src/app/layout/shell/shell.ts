import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { ApiService } from '../../services/api.service';
import { Notification, Listing } from '../../models/domain';
import { AcceptBidDialog, AcceptBidDialogData } from '../../shared/accept-bid-dialog/accept-bid-dialog';

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
  feedOpen = signal(false);
  notifications = signal<Notification[]>([]);

  readonly navLinks = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Market', route: '/market' },
    { label: 'Assets', route: '/assets' },
  ];

  private listings = signal<Listing[]>([]);

  constructor(
    public auth: AuthService,
    private socket: SocketService,
    private api: ApiService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;

    this.socket.connect(user.id);

    // Load initial notifications + listings
    this.api.getNotifications(user.id).subscribe((notifs) => {
      this.notifications.set(notifs);
      this.unreadCount.set(notifs.filter((n) => !n.read).length);
    });

    this.api.getTraderPortfolio(user.id).subscribe((p) => {
      this.listings.set(p.listings);
    });

    // Real-time notifications — only for signed-in user
    this.socket
      .onNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.notification.traderId !== user.id) return;
        this.notifications.update((list) => [event.notification, ...list]);
        this.unreadCount.update((n) => n + 1);
      });
  }

  toggleFeed(): void {
    const opening = !this.feedOpen();
    this.feedOpen.set(opening);
    if (opening) {
      this.unreadCount.set(0);
    }
  }

  closeFeed(): void {
    this.feedOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }

  timeAgo(dateStr: string): string {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  }

  notifIcon(type: string): string {
    const map: Record<string, string> = {
      bid_received: 'gavel',
      bid_accepted: 'check_circle',
      bid_rejected: 'cancel',
      bid_withdrawn: 'undo',
      bid_outbid: 'trending_up',
      pet_purchased: 'shopping_cart',
      pet_sold: 'sell',
    };
    return map[type] ?? 'info';
  }

  notifColor(type: string): string {
    const map: Record<string, string> = {
      bid_received: '#004d99',
      bid_accepted: '#007367',
      bid_rejected: '#ba1a1a',
      bid_outbid: '#f89c00',
      pet_purchased: '#007367',
      pet_sold: '#004d99',
    };
    return map[type] ?? '#727783';
  }

  onNotifClick(n: Notification): void {
    if (n.type !== 'bid_received') return;

    // Find the listing for this pet
    const listing = this.listings().find((l) => l.pet.breedName === n.petBreedName);
    if (!listing || !listing.highestBid) return;

    this.closeFeed();

    const PET_NAMES: Record<string, string> = {
      'pet-a1': 'Max', 'pet-a2': 'Luna', 'pet-a3': 'Bubbles',
    };

    this.dialog.open(AcceptBidDialog, {
      data: {
        petName: PET_NAMES[listing.petId] ?? listing.pet.breedName,
        petBreed: listing.pet.breedName,
        petHealth: listing.pet.health,
        petAge: listing.pet.age,
        intrinsicValue: listing.pet.intrinsicValue,
        highestBid: {
          bidderName: n.counterpartyName ?? listing.highestBid.bidderName,
          amount: n.amount ?? listing.highestBid.amount,
          timeAgo: this.timeAgo(n.createdAt),
        },
        otherOffers: [
          { bidderName: 'Trader C', amount: 78, timeAgo: '4 minutes ago' },
          { bidderName: 'Trader A', amount: 62.5, timeAgo: '10 minutes ago' },
        ],
        listingId: listing.id,
      } as AcceptBidDialogData,
      width: '460px',
    });
  }
}
