import { Component, OnInit, signal, computed, effect, DestroyRef } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Pet, PetType, Breed } from '../../models/domain';
import { ListForSaleDialog, ListForSaleDialogData, ListForSaleDialogResult } from '../../shared/list-for-sale-dialog/list-for-sale-dialog';
import { PlaceBidDialog, PlaceBidDialogData, PlaceBidDialogResult } from '../../shared/place-bid-dialog/place-bid-dialog';
import { PurchasePetDialog, PurchasePetDialogData, PurchasePetDialogResult } from '../../shared/purchase-pet-dialog/purchase-pet-dialog';
import { getPetImage } from '../../shared/utils/pet-images';
import { PetStatsUpdateEvent, ListingUpdateEvent, ListingRemovedEvent } from '../../models/socket-events';

interface MarketListing {
  id: string;
  petBreed: string;
  petType: PetType;
  sellerId: string;
  seller: string;
  askingPrice: number;
  intrinsicValue: number;
  health: number;
  age: number;
  petId: string;
  highestBidBidderId?: string;
  highestBidAmount?: number;
}

interface RetailCard {
  breed: Breed;
  price: number;
  supply: number;
}

@Component({
  selector: 'app-market',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './market.html',
  styleUrl: './market.scss',
})
export class Market implements OnInit {
  typeFilter = signal<PetType | ''>('');
  sortField = signal<'intrinsicValue' | 'askingPrice' | 'age'>('intrinsicValue');
  currentPage = signal(1);
  readonly pageSize = 10;

  listings = signal<MarketListing[]>([]);
  retailCards = signal<RetailCard[]>([]);

  readonly typeFilters: { label: string; value: PetType | ''; icon: string }[] = [
    { label: 'Dog', value: 'Dog', icon: '🐕' },
    { label: 'Cat', value: 'Cat', icon: '🐱' },
    { label: 'Bird', value: 'Bird', icon: '🐦' },
    { label: 'Fish', value: 'Fish', icon: '🐠' },
  ];

  private allFiltered = computed(() => {
    const userId = this.auth.user()?.id;
    let result = this.listings().filter((l) => l.sellerId !== userId);
    const type = this.typeFilter();
    if (type) result = result.filter((l) => l.petType === type);
    const field = this.sortField();
    return [...result].sort((a, b) => (b as any)[field] - (a as any)[field]);
  });

  totalPages = computed(() => Math.ceil(this.allFiltered().length / this.pageSize));
  showPagination = computed(() => this.totalPages() > 1);
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  filteredListings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.allFiltered().slice(start, start + this.pageSize);
  });

  private traderId = '';
  private myPets = signal<Pet[]>([]);
  private myListedPetIds = signal<Set<string>>(new Set());
  private myBidsByListing = signal<Map<string, number>>(new Map());
  private myHighestBidListingIds = signal<Set<string>>(new Set());
  private myAvailableCash = signal(450);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private socket: SocketService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
  ) {
    effect(() => {
      const p = this.auth.portfolio();
      if (p) {
        this.myPets.set(p.pets);
        this.myListedPetIds.set(new Set(p.listings.map((l) => l.petId)));
        this.myAvailableCash.set(p.availableCash);
        const bidMap = new Map<string, number>();
        for (const bid of p.bids) {
          if (bid.status === 'active') {
            bidMap.set(bid.listingId, bid.amount);
          }
        }
        this.myBidsByListing.set(bidMap);
      }
    });

    // Real-time pet updates (for intrinsic value and health)
    this.socket
      .onPetStatsUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: PetStatsUpdateEvent) => {
        this.listings.update((list) =>
          list.map((l) => {
            const tick = event.pets.find((p) => p.id === l.petId);
            return tick ? { ...l, ...tick } : l;
          }),
        );
      });

    // Real-time listing updates
    this.socket
      .onListingUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: ListingUpdateEvent) => {
        const l = event.listing;
        this.listings.update((list) => {
          const idx = list.findIndex((item) => item.id === l.id);
          const mapped: MarketListing = {
            id: l.id,
            petBreed: l.pet.breedName,
            petType: l.pet.type,
            sellerId: l.sellerId,
            seller: l.sellerName,
            askingPrice: l.askingPrice,
            intrinsicValue: l.pet.intrinsicValue,
            health: l.pet.health,
            age: l.pet.age,
            petId: l.petId,
          };
          if (idx > -1) {
            const newList = [...list];
            newList[idx] = mapped;
            return newList;
          }
          return [mapped, ...list];
        });
      });

    this.socket
      .onListingRemoved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: ListingRemovedEvent) => {
        this.listings.update((list) => list.filter((l) => l.id !== event.listingId));
      });
  }

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.traderId = user.id;

    // Load secondary market listings
    this.reloadListings();

    // Retail supply
    this.api.getRetailItems().subscribe((items) => {
      this.retailCards.set(items.slice(0, 4).map(item => ({
        breed: item.breed,
        price: item.breed.basePrice,
        supply: item.supplyRemaining
      })));
    });
  }

  private reloadListings(): void {
    this.api.getListings().subscribe((listings) => {
      const userId = this.auth.user()?.id;
      const myBidIds = new Set<string>();

      const mapped = listings
        .filter((l) => l.pet)
        .map((l) => {
          const bidderId = l.highestBid?.bidderId;
          if (bidderId === userId) {
            myBidIds.add(l.id);
          }
          return {
            id: l.id,
            petBreed: l.pet.breedName,
            petType: l.pet.type,
            sellerId: l.sellerId,
            seller: l.sellerName,
            askingPrice: l.askingPrice,
            intrinsicValue: l.pet.intrinsicValue,
            health: l.pet.health,
            age: l.pet.age,
            petId: l.petId,
            highestBidBidderId: bidderId,
            highestBidAmount: l.highestBid?.amount,
          };
        });

      this.listings.set(mapped);
      this.myHighestBidListingIds.set(myBidIds);

      // Also update myBidsByListing from highestBid data
      const bidMap = new Map<string, number>();
      for (const m of mapped) {
        if (m.highestBidBidderId === userId && m.highestBidAmount) {
          bidMap.set(m.id, m.highestBidAmount);
        }
      }
      // Merge with existing bids from portfolio
      const existing = this.myBidsByListing();
      for (const [k, v] of bidMap) {
        existing.set(k, v);
      }
      this.myBidsByListing.set(new Map(existing));
    });
  }

  setTypeFilter(value: PetType | ''): void {
    this.typeFilter.set(this.typeFilter() === value ? '' : value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((p) => p + 1);
  }

  healthPillClass(health: number): string {
    if (health > 70) return 'health-pill--green';
    if (health > 40) return 'health-pill--amber';
    return 'health-pill--red';
  }

  healthBarClass(health: number): string {
    if (health > 70) return 'health-bar-mini__fill--green';
    if (health > 40) return 'health-bar-mini__fill--amber';
    return 'health-bar-mini__fill--red';
  }

  breedImage(name: string): string {
    return getPetImage(name);
  }

  isOwnListing(listing: MarketListing): boolean {
    return listing.sellerId === this.auth.user()?.id;
  }

  hasActiveBid(listing: MarketListing): boolean {
    // Check the bidsByListing map from portfolio
    if (this.myBidsByListing().has(listing.id)) return true;
    // Also check if the raw listing's highestBid belongs to us
    return this.myHighestBidListingIds().has(listing.id);
  }

  openCreateListing(): void {
    const unlisted = this.myPets().filter((p) => !this.myListedPetIds().has(p.id));
    const dialogRef = this.dialog.open(ListForSaleDialog, {
      data: { pet: null, pets: unlisted } as ListForSaleDialogData,
      width: '440px',
    });

    dialogRef.afterClosed().subscribe((result: ListForSaleDialogResult | undefined) => {
      if (result) {
        this.api.createListing(result.petId, result.askingPrice).subscribe(() => {
          this.auth.refreshProfile();
        });
      }
    });
  }

  openPlaceBid(listing: MarketListing): void {
    const previousBid = this.myBidsByListing().get(listing.id);
    const dialogRef = this.dialog.open(PlaceBidDialog, {
      data: {
        petBreed: listing.petBreed,
        seller: listing.seller,
        askingPrice: listing.askingPrice,
        intrinsicValue: listing.intrinsicValue,
        currentHighestBid: 0,
        availableCash: this.myAvailableCash(),
        listingId: listing.id,
        previousBid,
      } as PlaceBidDialogData,
      width: '440px',
    });

    dialogRef.afterClosed().subscribe((result: PlaceBidDialogResult | undefined) => {
      if (result) {
        this.api.placeBid(result.listingId, result.amount).subscribe({
          next: () => {
            this.auth.refreshProfile();
            this.reloadListings();
          },
          error: (err) => {
            const msg = err?.error?.message || err?.message || 'Failed to place bid';
            console.error('Place bid failed:', msg);
            alert(msg);
          },
        });
      }
    });
  }

  openBuyRetail(item: RetailCard): void {
    const dialogRef = this.dialog.open(PurchasePetDialog, {
      data: {
        breed: item.breed,
        supply: item.supply,
        availableCash: this.myAvailableCash(),
      } as PurchasePetDialogData,
      width: '420px',
    });

    dialogRef.afterClosed().subscribe((result: PurchasePetDialogResult | undefined) => {
      if (result) {
        this.api.buyNewPet(result.breedName, result.quantity).subscribe(() => {
          this.auth.refreshProfile();
        });
      }
    });
  }
}
