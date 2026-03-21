import { Component, DestroyRef, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Pet } from '../../models/domain';
import { ListForSaleDialog, ListForSaleDialogData } from '../../shared/list-for-sale-dialog/list-for-sale-dialog';

const PET_NAMES: Record<string, string> = {
  'pet-a1': 'Max',
  'pet-a2': 'Luna',
  'pet-a3': 'Bubbles',
  'pet-b1': 'Miso',
  'pet-b2': 'Rio',
  'pet-c1': 'Snoopy',
  'pet-c2': 'Cleo',
  'pet-c3': 'Kiwi',
  'pet-c4': 'Finn',
};

const BREED_LABELS: Record<string, string> = {
  Labrador: 'Golden Labrador Retriever',
  Poodle: 'Standard Poodle',
  Goldfish: 'Common Goldfish',
  Siamese: 'Siamese Cat',
  Macaw: 'Blue-and-Gold Macaw',
  Beagle: 'Beagle Hound',
  Bengal: 'Bengal Cat',
  Parakeet: 'Green Parakeet',
  Betta: 'Siamese Fighting Fish',
};

@Component({
  selector: 'app-asset-detail',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.scss',
})
export class AssetDetail implements OnInit {
  pet = signal<Pet | null>(null);
  isListed = signal(false);
  unlistedPets = signal<Pet[]>([]);

  petName = computed(() => PET_NAMES[this.pet()?.id ?? ''] ?? 'Pet');
  breedLabel = computed(() => BREED_LABELS[this.pet()?.breedName ?? ''] ?? this.pet()?.breedName ?? '');

  healthFactor = computed(() => {
    const p = this.pet();
    return p ? +(p.health / 100).toFixed(2) : 0;
  });

  ageFactor = computed(() => {
    const p = this.pet();
    if (!p) return 0;
    return +Math.max(0, 1 - p.age / p.lifespan).toFixed(3);
  });

  desirabilityFactor = computed(() => {
    const p = this.pet();
    return p ? +(p.desirability / 10).toFixed(1) : 0;
  });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
    private socket: SocketService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    const petId = this.route.snapshot.paramMap.get('id');
    if (!user || !petId) return;

    this.api.getTraderPortfolio(user.id).subscribe((portfolio) => {
      const found = portfolio.pets.find((p) => p.id === petId);
      if (found) this.pet.set(found);
      const listedIds = new Set(portfolio.listings.map((l) => l.petId));
      this.isListed.set(listedIds.has(petId));
      this.unlistedPets.set(portfolio.pets.filter((p) => !listedIds.has(p.id)));
    });

    this.socket
      .onPetStatsUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const tick = event.pets.find((p) => p.id === petId);
        if (tick && this.pet()) {
          this.pet.update((pet) => (pet ? { ...pet, ...tick } : pet));
        }
      });
  }

  healthColor(health: number): string {
    if (health > 70) return 'primary';
    if (health > 40) return 'accent';
    return 'warn';
  }

  stars(desirability: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(desirability / 2));
  }

  openListForSale(): void {
    const pet = this.pet();
    if (!pet) return;
    this.dialog.open(ListForSaleDialog, {
      data: { pet, pets: this.unlistedPets() } as ListForSaleDialogData,
      width: '440px',
    });
  }
}
