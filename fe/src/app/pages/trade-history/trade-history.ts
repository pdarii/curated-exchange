import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Pet, HistoryEvent, HistoryType } from '../../models/domain';
import { getPetName } from '../../shared/utils/pet-names';

@Component({
  selector: 'app-trade-history',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.scss',
})
export class TradeHistory implements OnInit {
  pet = signal<Pet | null>(null);
  petName = signal('');
  petBreed = signal('');

  trades = signal<HistoryEvent[]>([]);

  activeFilter = signal<HistoryType | 'all'>('all');

  readonly filterOptions: { label: string; value: HistoryType | 'all' }[] = [
    { label: 'All Events', value: 'all' },
    { label: 'Sold', value: 'sold' },
    { label: 'Purchased', value: 'purchased' },
    { label: 'Listed', value: 'listed' },
    { label: 'Bid', value: 'bid' },
    { label: 'Minted', value: 'minted' },
  ];

  filteredTrades = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.trades();
    return this.trades().filter((t) => t.type === filter);
  });

  activeFilterLabel = computed(() =>
    this.filterOptions.find((o) => o.value === this.activeFilter())?.label ?? 'All Events',
  );

  totalTrades = signal(2);
  peakValuation = signal(120);
  daysInPortfolio = signal(45);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
  ) {
    effect(() => {
      const petId = this.route.snapshot.paramMap.get('id');
      const portfolio = this.auth.portfolio();
      if (portfolio && petId) {
        const found = portfolio.pets.find((p) => p.id === petId);
        if (found) {
          this.pet.set(found);
          this.petName.set(getPetName(found.id, found.breedName, found.name));
          this.petBreed.set(found.breedName);
          this.loadHistory(petId);
        }
      }
    });
  }

  private loadHistory(petId: string) {
    this.api.getPetHistory(petId).subscribe((events) => {
      this.trades.set(events);
      this.totalTrades.set(events.filter((e) => e.type === 'sold' || e.type === 'purchased').length);
      const prices = events.filter((e) => e.amount).map((e) => e.amount as number);
      if (prices.length) {
        this.peakValuation.set(Math.max(...prices));
      }
    });
  }

  ngOnInit(): void {
    const user = this.auth.user();
    const petId = this.route.snapshot.paramMap.get('id');
    if (!user || !petId) return;
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      minted: 'Minted',
      purchased: 'Purchased',
      listed: 'Listed',
      bid: 'Bid Received',
      sold: 'Sold',
    };
    return map[type] ?? type;
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      minted: 'type-badge--teal',
      purchased: 'type-badge--teal',
      listed: 'type-badge--amber',
      bid: 'type-badge--blue',
      sold: 'type-badge--green',
    };
    return map[type] ?? '';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      origin: 'status-badge--outline',
      completed: 'status-badge--teal',
      expired: 'status-badge--outline',
      settled: 'status-badge--outline',
      void: 'status-badge--outline',
      withdrawn: 'status-badge--outline',
    };
    return map[status] ?? '';
  }
}
