import { Component, DestroyRef, OnInit, signal, computed, effect } from '@angular/core';
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
import { getPetImage } from '../../shared/utils/pet-images';
import { getPetName } from '../../shared/utils/pet-names';

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

  petName = computed(() => {
    const p = this.pet();
    return p ? getPetName(p.id, p.breedName) : 'Pet';
  });
  breedLabel = computed(() => this.pet()?.breedName ?? '');
  petImageUrl = computed(() => getPetImage(this.pet()?.breedName ?? ''));

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
  ) {
    effect(() => {
      const petId = this.route.snapshot.paramMap.get('id');
      const portfolio = this.auth.portfolio();
      if (portfolio && petId) {
        const found = portfolio.pets.find((p) => p.id === petId);
        if (found) this.pet.set(found);
        const listedIds = new Set(portfolio.listings.map((l) => l.petId));
        this.isListed.set(listedIds.has(petId));
        this.unlistedPets.set(portfolio.pets.filter((p) => !listedIds.has(p.id)));
      }
    });
  }

  ngOnInit(): void {
    const user = this.auth.user();
    const petId = this.route.snapshot.paramMap.get('id');
    if (!user || !petId) return;

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
    const dialogRef = this.dialog.open(ListForSaleDialog, {
      data: { pet, pets: this.unlistedPets() } as ListForSaleDialogData,
      width: '440px',
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.api.createListing(result.petId, result.askingPrice).subscribe(() => {
          this.auth.refreshProfile();
        });
      }
    });
  }
}
