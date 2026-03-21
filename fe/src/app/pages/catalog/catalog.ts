import { Component, OnInit, signal, computed, Signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Breed, PetType } from '../../models/domain';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { MOCK_BREEDS } from '../../services/mock-data';
import { PurchasePetDialog, PurchasePetDialogData } from '../../shared/purchase-pet-dialog/purchase-pet-dialog';

interface CatalogItem {
  breed: Breed;
  supply: number;
}

@Component({
  selector: 'app-catalog',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatMenuModule,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  typeFilter = signal<PetType | ''>('');
  sortField = signal<'newest' | 'price_asc' | 'price_desc' | 'lifespan' | 'desirability'>('newest');
  currentPage = signal(1);
  readonly pageSize = 8;

  items = signal<CatalogItem[]>([]);

  readonly typeFilters: { label: string; value: PetType | ''; icon: string }[] = [
    { label: 'Dog', value: 'Dog', icon: '🐕' },
    { label: 'Cat', value: 'Cat', icon: '🐱' },
    { label: 'Bird', value: 'Bird', icon: '🐦' },
    { label: 'Fish', value: 'Fish', icon: '🐠' },
  ];

  readonly sortOptions: { label: string; value: 'newest' | 'price_asc' | 'price_desc' | 'lifespan' | 'desirability' }[] = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Lifespan', value: 'lifespan' },
    { label: 'Desirability', value: 'desirability' },
  ];

  activeSortLabel = computed(() =>
    this.sortOptions.find((o) => o.value === this.sortField())?.label ?? 'Newest Arrivals',
  );

  private allFiltered = computed(() => {
    let result = this.items();
    const type = this.typeFilter();
    if (type) result = result.filter((i) => i.breed.type === type);
    const sort = this.sortField();
    return [...result].sort((a, b) => {
      switch (sort) {
        case 'price_asc': return a.breed.basePrice - b.breed.basePrice;
        case 'price_desc': return b.breed.basePrice - a.breed.basePrice;
        case 'lifespan': return b.breed.lifespan - a.breed.lifespan;
        case 'desirability': return b.breed.desirability - a.breed.desirability;
        default: return 0;
      }
    });
  });

  totalPages = computed(() => Math.ceil(this.allFiltered().length / this.pageSize));
  showPagination = computed(() => this.totalPages() > 1);
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  totalItems = computed(() => this.allFiltered().length);

  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.allFiltered().slice(start, start + this.pageSize);
  });

  private availableCash = 450;

  constructor(
    private dialog: MatDialog,
    private auth: AuthService,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.api.getTraderPortfolio(user.id).subscribe((p) => {
        this.availableCash = p.availableCash;
      });
    }

    this.items.set(
      MOCK_BREEDS.map((breed) => ({
        breed,
        supply: Math.floor(Math.random() * 15) + 1,
      })),
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

  private readonly BREED_SUBS: Record<string, string> = {
    Labrador: 'Golden Heritage',
    Beagle: 'Classic Hound',
    Poodle: 'Standard Elite',
    Bulldog: 'British Royal',
    'Pit Bull': 'American Strong',
    Siamese: 'Azure Point',
    Persian: 'Snow White',
    'Maine Coon': 'Forest Giant',
    Bengal: 'Wild Spotted',
    Sphynx: 'Velvet Touch',
    Parakeet: 'Green Flash',
    Canary: 'Golden Song',
    Cockatiel: 'Grey Crest',
    Macaw: 'Scarlet Premium',
    Lovebird: 'Rose Wing',
    Goldfish: 'Oranda Fancy',
    Betta: 'Halfmoon Blue',
    Guppy: 'Neon Tail',
    Angelfish: 'Silver Veil',
    Clownfish: 'Coral Star',
  };

  breedSubtitle(name: string): string {
    return this.BREED_SUBS[name] ?? name;
  }

  supplyLabel(supply: number): string {
    if (supply <= 1) return 'Last One';
    if (supply <= 3) return 'Limited';
    return `${supply} Left`;
  }

  supplyBadgeClass(supply: number): string {
    if (supply <= 1) return 'supply-badge--red';
    if (supply <= 3) return 'supply-badge--amber';
    return 'supply-badge--green';
  }

  lifespanRange(lifespan: number): string {
    const low = Math.max(1, lifespan - 2);
    return `${low}-${lifespan} Yrs`;
  }

  desirabilityLabel(d: number): string {
    if (d >= 9) return 'Rare Desirability';
    if (d >= 7) return 'High Desirability';
    if (d >= 5) return 'Mid Desirability';
    return 'Low Desirability';
  }

  maintenanceLabel(m: number): string {
    if (m >= 7) return 'High Maint.';
    if (m >= 4) return 'Mid Maint.';
    return 'Low Maint.';
  }

  openBuy(item: CatalogItem): void {
    this.dialog.open(PurchasePetDialog, {
      data: {
        breed: item.breed,
        supply: item.supply,
        availableCash: this.availableCash,
      } as PurchasePetDialogData,
      width: '420px',
    });
  }
}
