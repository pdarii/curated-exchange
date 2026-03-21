import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, interval, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SocketEvent,
  SocketEventType,
  PetStatsUpdateEvent,
  BidUpdateEvent,
  ListingUpdateEvent,
  ListingRemovedEvent,
  TradeCompletedEvent,
  NotificationEvent,
  LeaderboardUpdateEvent,
  CashUpdateEvent,
} from '../models/socket-events';
import { MOCK_PETS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private events$ = new Subject<SocketEvent>();
  private mockSub: Subscription | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // -------------------------------------------------------------------------
  // Connect / disconnect
  // -------------------------------------------------------------------------

  connect(traderId: string): void {
    if (environment.useMockSockets) {
      this.startMockStream(traderId);
      return;
    }

    this.disconnect();
    const url = `${environment.wsUrl}?traderId=${traderId}`;
    this.socket = new WebSocket(url);

    this.socket.onmessage = (msg) => {
      const event: SocketEvent = JSON.parse(msg.data);
      this.events$.next(event);
    };

    this.socket.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(traderId), 3000);
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.mockSub?.unsubscribe();
    this.mockSub = null;
    this.socket?.close();
    this.socket = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.events$.complete();
  }

  // -------------------------------------------------------------------------
  // Typed event streams — components subscribe to the ones they need
  // -------------------------------------------------------------------------

  on<T extends SocketEvent>(type: T['type']): Observable<T> {
    return this.events$.pipe(
      filter((e): e is T => e.type === type),
    );
  }

  onPetStatsUpdate(): Observable<PetStatsUpdateEvent> {
    return this.on<PetStatsUpdateEvent>('pet_stats_update');
  }

  onBidUpdate(): Observable<BidUpdateEvent> {
    return this.on<BidUpdateEvent>('bid_update');
  }

  onListingUpdate(): Observable<ListingUpdateEvent> {
    return this.on<ListingUpdateEvent>('listing_update');
  }

  onListingRemoved(): Observable<ListingRemovedEvent> {
    return this.on<ListingRemovedEvent>('listing_removed');
  }

  onTradeCompleted(): Observable<TradeCompletedEvent> {
    return this.on<TradeCompletedEvent>('trade_completed');
  }

  onNotification(): Observable<NotificationEvent> {
    return this.on<NotificationEvent>('notification');
  }

  onLeaderboardUpdate(): Observable<LeaderboardUpdateEvent> {
    return this.on<LeaderboardUpdateEvent>('leaderboard_update');
  }

  onCashUpdate(): Observable<CashUpdateEvent> {
    return this.on<CashUpdateEvent>('cash_update');
  }

  // -------------------------------------------------------------------------
  // Mock stream — simulates server pushes until BE is ready
  // -------------------------------------------------------------------------

  private startMockStream(traderId: string): void {
    this.mockSub?.unsubscribe();

    // Clone so mutations don't leak across calls
    const pets = MOCK_PETS.map((p) => ({ ...p }));

    // Emit pet stat ticks every 5 seconds (accelerated for dev)
    this.mockSub = interval(5_000)
      .pipe(
        map(() => {
          // Fluctuate health ±5%, advance age
          for (const pet of pets) {
            const delta = (Math.random() - 0.5) * 10; // ±5
            pet.health = Math.min(100, Math.max(0, pet.health + delta));
            pet.age = +(pet.age + 0.01).toFixed(3);
            pet.expired = pet.age >= pet.lifespan;
            const ageFactor = Math.max(0, 1 - pet.age / pet.lifespan);
            pet.intrinsicValue = pet.expired
              ? 0
              : +(pet.basePrice * (pet.health / 100) * (pet.desirability / 10) * ageFactor).toFixed(2);
          }

          const event: PetStatsUpdateEvent = {
            type: 'pet_stats_update',
            pets: pets.map(({ id, age, health, intrinsicValue, expired }) => ({
              id,
              age,
              health,
              intrinsicValue,
              expired,
            })),
          };
          return event;
        }),
      )
      .subscribe((event) => this.events$.next(event));
  }
}
