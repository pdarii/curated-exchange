import { Component, DestroyRef, OnInit, signal, computed, effect } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Pet, PetType } from '../../models/domain';
import { ListForSaleDialog, ListForSaleDialogData, ListForSaleDialogResult } from '../../shared/list-for-sale-dialog/list-for-sale-dialog';
import { getPetName } from '../../shared/utils/pet-names';
import { getPetImage } from '../../shared/utils/pet-images';

const TYPE_ICONS: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐱',
  Bird: '🐦',
  Fish: '🐠',
};

type SortField = 'age' | 'health' | 'intrinsicValue' | 'breedName';

@Component({
  selector: 'app-assets',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatMenuModule,
  ],
  templateUrl: './assets.html',
  styleUrl: './assets.scss',
})
export class Assets implements OnInit {
  pets = signal<Pet[]>([]);
  listedPetIds = signal<Set<string>>(new Set());
  bidPetIds = signal<Set<string>>(new Set());

  searchQuery = signal('');
  typeFilter = signal<PetType | ''>('');
  sortField = signal<SortField>('age');

  traderName = signal('');
  private traderId = '';

  // Filtered + sorted pets
  filteredPets = computed(() => {
    let result = this.pets();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.breedName.toLowerCase().includes(q) ||
          (p.name ?? '').toLowerCase().includes(q) ||
          getPetName(p.id, '').toLowerCase().includes(q),
      );
    }
    const type = this.typeFilter();
    if (type) {
      result = result.filter((p) => p.type === type);
    }
    const field = this.sortField();
    return [...result].sort((a, b) => {
      if (field === 'breedName') return a.breedName.localeCompare(b.breedName);
      return (b as any)[field] - (a as any)[field];
    });
  });

  // Stats
  totalAssets = computed(() => this.pets().length);
  avgHealth = computed(() => {
    const p = this.pets();
    return p.length ? Math.round(p.reduce((s, pet) => s + pet.health, 0) / p.length) : 0;
  });
  liquidity = computed(() => this.pets().reduce((s, p) => s + p.intrinsicValue, 0));

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
        this.pets.set(p.pets);
        this.listedPetIds.set(new Set(p.listings.map((l) => l.petId)));
        this.bidPetIds.set(
          new Set(p.bids.filter((b) => b.status === 'active').map((b) => b.petId)),
        );
      }
    });
  }

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.traderId = user.id;
    this.traderName.set(user.name);

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
      });

    // Real-time listing/bid status updates
    this.socket
      .onListingUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.auth.refreshProfile();
      });

    this.socket
      .onListingRemoved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.auth.refreshProfile();
      });
  }

  petName(id: string, fallback: string, apiName?: string): string {
    return getPetName(id, fallback, apiName);
  }

  petImage(breedName: string): string {
    return getPetImage(breedName);
  }

  typeIcon(type: string): string {
    return TYPE_ICONS[type] ?? '🐾';
  }

  healthColor(health: number): string {
    if (health > 70) return 'primary';
    if (health > 40) return 'accent';
    return 'warn';
  }

  openCreateListing(pet?: Pet): void {
    const unlisted = this.pets().filter((p) => !this.listedPetIds().has(p.id));
    const dialogRef = this.dialog.open(ListForSaleDialog, {
      data: { pet: pet ?? null, pets: unlisted } as ListForSaleDialogData,
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

  petStatus(petId: string): 'listed' | 'bid' | 'inventory' {
    if (this.listedPetIds().has(petId)) return 'listed';
    if (this.bidPetIds().has(petId)) return 'bid';
    return 'inventory';
  }
}
