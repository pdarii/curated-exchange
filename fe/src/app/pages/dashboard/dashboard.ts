import { Component, DestroyRef, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Pet, Listing, Bid, Notification } from '../../models/domain';
import { ListForSaleDialog, ListForSaleDialogData } from '../../shared/list-for-sale-dialog/list-for-sale-dialog';
import { AcceptBidDialog, AcceptBidDialogData } from '../../shared/accept-bid-dialog/accept-bid-dialog';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
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
  marketEvents = signal<Notification[]>([
    {
      id: 'market-1',
      traderId: '',
      type: 'pet_sold',
      message: '<b>Trader C</b> listed a <b>Bengal</b> for <b>$85</b>',
      petBreedName: 'Bengal',
      amount: 85,
      counterpartyName: 'Charlie',
      read: false,
      createdAt: '2026-03-21T10:15:00Z',
    },
    {
      id: 'market-2',
      traderId: '',
      type: 'pet_sold',
      message: 'New Supply: <b>10 Labrador</b> pups available for minting',
      petBreedName: 'Labrador',
      amount: null,
      counterpartyName: null,
      read: false,
      createdAt: '2026-03-21T09:00:00Z',
    },
    {
      id: 'market-3',
      traderId: '',
      type: 'pet_sold',
      message: '<b>Trader B</b> listed a <b>Macaw</b> for <b>$150</b>',
      petBreedName: 'Macaw',
      amount: 150,
      counterpartyName: 'Bob',
      read: true,
      createdAt: '2026-03-21T08:30:00Z',
    },
  ]);

  private traderId = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private socket: SocketService,
    private dialog: MatDialog,
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

  openNewListing(): void {
    const unlistedPets = this.pets().filter((p) => !this.isListed(p.id));
    this.dialog.open(ListForSaleDialog, {
      data: { pet: null, pets: unlistedPets } as ListForSaleDialogData,
      width: '440px',
    });
  }

  openAcceptBid(listing: Listing): void {
    if (!listing.highestBid) return;
    const PET_NAMES: Record<string, string> = {
      'pet-a1': 'Max', 'pet-a2': 'Luna', 'pet-a3': 'Bubbles',
    };
    this.dialog.open(AcceptBidDialog, {
      data: {
        petName: PET_NAMES[listing.petId] ?? listing.pet.breedName,
        petBreed: `Yellow ${listing.pet.breedName}`,
        petHealth: listing.pet.health,
        petAge: listing.pet.age,
        intrinsicValue: listing.pet.intrinsicValue,
        highestBid: {
          bidderName: listing.highestBid.bidderName,
          amount: listing.highestBid.amount,
          timeAgo: '2 mins ago',
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
