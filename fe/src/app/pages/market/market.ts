import { Component, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Pet, PetType, Listing, Breed } from '../../models/domain';
import { MOCK_BREEDS } from '../../services/mock-data';
import { ListForSaleDialog, ListForSaleDialogData } from '../../shared/list-for-sale-dialog/list-for-sale-dialog';
import { PlaceBidDialog, PlaceBidDialogData } from '../../shared/place-bid-dialog/place-bid-dialog';
import { PurchasePetDialog, PurchasePetDialogData } from '../../shared/purchase-pet-dialog/purchase-pet-dialog';

interface MarketListing {
  id: string;
  petBreed: string;
  petType: PetType;
  seller: string;
  askingPrice: number;
  intrinsicValue: number;
  health: number;
  age: number;
  petId: string;
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
    const userName = this.auth.user()?.name;
    let result = this.listings().filter((l) => l.seller !== userName);
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
  private myAvailableCash = signal(450);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.traderId = user.id;

    // Load secondary market listings + mock extras
    this.api.getListings().subscribe((listings) => {
      const apiListings: MarketListing[] = listings.map((l) => ({
        id: l.id,
        petBreed: l.pet.breedName,
        petType: l.pet.type,
        seller: l.sellerName,
        askingPrice: l.askingPrice,
        intrinsicValue: l.pet.intrinsicValue,
        health: l.pet.health,
        age: l.pet.age,
        petId: l.petId,
      }));

      this.listings.set([
        ...apiListings,
        { id: 'ml-1', petBreed: 'Pug', petType: 'Dog', seller: 'Trader B', askingPrice: 2450, intrinsicValue: 2100, health: 94, age: 2.4, petId: 'ml-p1' },
        { id: 'ml-2', petBreed: 'Dachshund', petType: 'Dog', seller: 'Trader C', askingPrice: 1800, intrinsicValue: 1920, health: 88, age: 1.1, petId: 'ml-p2' },
        { id: 'ml-3', petBreed: 'Tabby Cat', petType: 'Cat', seller: 'Trader B', askingPrice: 600, intrinsicValue: 580, health: 72, age: 4.3, petId: 'ml-p3' },
        { id: 'ml-4', petBreed: 'G. Retriever', petType: 'Dog', seller: 'Trader D', askingPrice: 2700, intrinsicValue: 3450, health: 98, age: 0.8, petId: 'ml-p4' },
        { id: 'ml-5', petBreed: 'Persian', petType: 'Cat', seller: 'Trader C', askingPrice: 950, intrinsicValue: 820, health: 91, age: 1.5, petId: 'ml-p5' },
        { id: 'ml-6', petBreed: 'Cockatiel', petType: 'Bird', seller: 'Trader B', askingPrice: 280, intrinsicValue: 245, health: 86, age: 3.2, petId: 'ml-p6' },
        { id: 'ml-7', petBreed: 'Macaw', petType: 'Bird', seller: 'Trader D', askingPrice: 4200, intrinsicValue: 3800, health: 97, age: 5.1, petId: 'ml-p7' },
        { id: 'ml-8', petBreed: 'Clownfish', petType: 'Fish', seller: 'Trader C', askingPrice: 85, intrinsicValue: 72, health: 79, age: 1.8, petId: 'ml-p8' },
        { id: 'ml-9', petBreed: 'Bulldog', petType: 'Dog', seller: 'Trader B', askingPrice: 1100, intrinsicValue: 960, health: 65, age: 3.7, petId: 'ml-p9' },
        { id: 'ml-10', petBreed: 'Maine Coon', petType: 'Cat', seller: 'Trader D', askingPrice: 1350, intrinsicValue: 1200, health: 93, age: 2.0, petId: 'ml-p10' },
        { id: 'ml-11', petBreed: 'Betta', petType: 'Fish', seller: 'Trader B', askingPrice: 45, intrinsicValue: 38, health: 82, age: 0.9, petId: 'ml-p11' },
        { id: 'ml-12', petBreed: 'Canary', petType: 'Bird', seller: 'Trader C', askingPrice: 160, intrinsicValue: 140, health: 90, age: 2.5, petId: 'ml-p12' },
        { id: 'ml-13', petBreed: 'Sphynx', petType: 'Cat', seller: 'Trader D', askingPrice: 780, intrinsicValue: 650, health: 77, age: 3.1, petId: 'ml-p13' },
        { id: 'ml-14', petBreed: 'Pit Bull', petType: 'Dog', seller: 'Trader C', askingPrice: 900, intrinsicValue: 750, health: 84, age: 2.8, petId: 'ml-p14' },
        { id: 'ml-15', petBreed: 'Angelfish', petType: 'Fish', seller: 'Trader B', askingPrice: 55, intrinsicValue: 48, health: 88, age: 1.2, petId: 'ml-p15' },
        { id: 'ml-16', petBreed: 'Lovebird', petType: 'Bird', seller: 'Trader D', askingPrice: 120, intrinsicValue: 95, health: 92, age: 4.0, petId: 'ml-p16' },
      ]);
    });

    // Load user's pets and bids for dialogs
    this.api.getTraderPortfolio(this.traderId).subscribe((p) => {
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
    });

    // Retail supply
    const featured = ['Labrador', 'Siamese', 'Beagle', 'Poodle'];
    this.retailCards.set(
      featured
        .map((name) => MOCK_BREEDS.find((b) => b.name === name))
        .filter((b): b is Breed => !!b)
        .map((b) => ({ breed: b, price: b.basePrice, supply: Math.floor(Math.random() * 10) + 1 })),
    );
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

  isOwnListing(listing: MarketListing): boolean {
    return listing.seller === this.auth.user()?.name;
  }

  hasActiveBid(listing: MarketListing): boolean {
    return this.myBidsByListing().has(listing.id);
  }

  openCreateListing(): void {
    const unlisted = this.myPets().filter((p) => !this.myListedPetIds().has(p.id));
    this.dialog.open(ListForSaleDialog, {
      data: { pet: null, pets: unlisted } as ListForSaleDialogData,
      width: '440px',
    });
  }

  openPlaceBid(listing: MarketListing): void {
    const previousBid = this.myBidsByListing().get(listing.id);
    this.dialog.open(PlaceBidDialog, {
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
  }

  openBuyRetail(item: RetailCard): void {
    this.dialog.open(PurchasePetDialog, {
      data: {
        breed: item.breed,
        supply: item.supply,
        availableCash: this.myAvailableCash(),
      } as PurchasePetDialogData,
      width: '420px',
    });
  }
}
