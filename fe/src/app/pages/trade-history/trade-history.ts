import { Component, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Pet } from '../../models/domain';

export interface TradeEvent {
  date: string;
  type: 'minted' | 'purchased' | 'listed_for_sale' | 'bid_received' | 'bid_withdrawn' | 'sold';
  counterparty: string;
  price: number;
  status: 'origin' | 'completed' | 'expired' | 'settled' | 'void' | 'withdrawn';
}

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

@Component({
  selector: 'app-trade-history',
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.scss',
})
export class TradeHistory implements OnInit {
  pet = signal<Pet | null>(null);
  petName = signal('');
  petBreed = signal('');

  // Mock trade history
  trades = signal<TradeEvent[]>([
    { date: 'Oct 24, 2023', type: 'sold', counterparty: 'Trader B', price: 115, status: 'completed' },
    { date: 'Oct 22, 2023', type: 'bid_received', counterparty: 'Trader B', price: 115, status: 'settled' },
    { date: 'Oct 20, 2023', type: 'listed_for_sale', counterparty: 'Trader A', price: 120, status: 'expired' },
    { date: 'Oct 18, 2023', type: 'bid_withdrawn', counterparty: 'Trader B', price: 95, status: 'void' },
    { date: 'Oct 17, 2023', type: 'bid_received', counterparty: 'Trader B', price: 95, status: 'withdrawn' },
    { date: 'Sep 10, 2023', type: 'purchased', counterparty: 'Trader A', price: 110, status: 'completed' },
    { date: 'Sep 09, 2023', type: 'minted', counterparty: 'Market (Admin)', price: 100, status: 'origin' },
  ]);

  activeFilter = signal<TradeEvent['type'] | 'all'>('all');

  readonly filterOptions: { label: string; value: TradeEvent['type'] | 'all' }[] = [
    { label: 'All Events', value: 'all' },
    { label: 'Sold', value: 'sold' },
    { label: 'Purchased', value: 'purchased' },
    { label: 'Listed for Sale', value: 'listed_for_sale' },
    { label: 'Bid Received', value: 'bid_received' },
    { label: 'Bid Withdrawn', value: 'bid_withdrawn' },
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
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    const petId = this.route.snapshot.paramMap.get('id');
    if (!user || !petId) return;

    this.api.getTraderPortfolio(user.id).subscribe((portfolio) => {
      const found = portfolio.pets.find((p) => p.id === petId);
      if (found) {
        this.pet.set(found);
        this.petName.set(PET_NAMES[found.id] ?? found.breedName);
        this.petBreed.set(found.breedName);
      }
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      minted: 'Minted',
      purchased: 'Purchased',
      listed_for_sale: 'Listed for Sale',
      bid_received: 'Bid Received',
      bid_withdrawn: 'Bid Withdrawn',
      sold: 'Sold',
    };
    return map[type] ?? type;
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      minted: 'type-badge--teal',
      purchased: 'type-badge--teal',
      listed_for_sale: 'type-badge--amber',
      bid_received: 'type-badge--blue',
      bid_withdrawn: 'type-badge--red',
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
