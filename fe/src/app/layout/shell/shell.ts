import { Component, DestroyRef, OnInit, signal, effect } from '@angular/core';
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
import { Notification as DomainNotification, Listing } from '../../models/domain';
import { AcceptBidDialog, AcceptBidDialogData } from '../../shared/accept-bid-dialog/accept-bid-dialog';
import { getPetName } from '../../shared/utils/pet-names';

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
  notifications = signal<DomainNotification[]>([]);

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
  ) {
    // Sync notifications from AuthService
    effect(() => {
      const prevCount = this.notifications().length;
      const newList = this.auth.notifications();
      this.notifications.set(newList);

      // If feed is closed and list grew, increment badge
      if (!this.feedOpen() && newList.length > prevCount && prevCount > 0) {
        this.unreadCount.update(n => n + (newList.length - prevCount));
      }
    });

    // Handle listings via portfolio signal
    effect(() => {
      const p = this.auth.portfolio();
      if (p) {
        this.listings.set(p.listings);
      }
    });
  }

  ngOnInit(): void {
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
    if (!dateStr) return '';
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

  onNotifClick(n: DomainNotification): void {
    if (n.type !== 'bid_received') return;

    // Find the listing — match by petBreedName from notification
    const listing = this.listings().find((l) =>
      l.pet?.breedName === n.petBreedName || l.highestBid?.petBreedName === n.petBreedName
    );
    if (!listing) return;

    this.closeFeed();

    // Use pet data if available, fallback to notification data
    const petBreed = listing.pet?.breedName ?? n.petBreedName ?? 'Pet';
    const petHealth = listing.pet?.health ?? 100;
    const petAge = listing.pet?.age ?? 0;
    const intrinsicValue = listing.pet?.intrinsicValue ?? n.amount ?? 0;
    const petName = listing.pet ? getPetName(listing.petId, listing.pet.breedName, listing.pet.name) : petBreed;

    this.dialog.open(AcceptBidDialog, {
      data: {
        petName,
        petBreed,
        petHealth,
        petAge,
        intrinsicValue,
        highestBid: {
          bidderName: n.counterpartyName ?? listing.highestBid?.bidderName ?? 'Unknown',
          amount: n.amount ?? listing.highestBid?.amount ?? 0,
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
