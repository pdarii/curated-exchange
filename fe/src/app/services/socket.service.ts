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
import { Notification } from '../models/domain';
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

    const subs = new Subscription();
    this.mockSub = subs;

    // Clone so mutations don't leak across calls
    const pets = MOCK_PETS.map((p) => ({ ...p }));

    // Emit pet stat ticks every 5 seconds (accelerated for dev)
    subs.add(
      interval(5_000)
        .pipe(
          map(() => {
            for (const pet of pets) {
              const delta = (Math.random() - 0.5) * 10;
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
                id, age, health, intrinsicValue, expired,
              })),
            };
            return event;
          }),
        )
        .subscribe((event) => this.events$.next(event)),
    );

    // Emit mock notifications every 8-15 seconds
    // Only events relevant to the signed-in trader:
    //   - Others' new listings (pet_sold)
    //   - Bids received on MY items (bid_received)
    //   - I was outbid (bid_outbid)
    //   - My bid accepted/rejected (bid_accepted / bid_rejected)
    const mockNotifs: Omit<Notification, 'id' | 'createdAt'>[] = [
      { traderId, type: 'bid_received', message: '<b>Trader B</b> placed a <b>$65</b> bid on your <b>Poodle</b>', petBreedName: 'Poodle', amount: 65, counterpartyName: 'Bob', read: false },
      { traderId, type: 'bid_outbid', message: 'Your bid on <b>Bengal</b> was outbid — new high bid <b>$52</b>', petBreedName: 'Bengal', amount: 52, counterpartyName: 'Charlie', read: false },
      { traderId, type: 'bid_received', message: '<b>Trader B</b> placed a <b>$42</b> bid on your <b>Goldfish</b>', petBreedName: 'Goldfish', amount: 42, counterpartyName: 'Bob', read: false },
      { traderId, type: 'bid_accepted', message: '<b>Trader C</b> accepted your bid on <b>Parakeet</b> for <b>$18</b>', petBreedName: 'Parakeet', amount: 18, counterpartyName: 'Charlie', read: false },
      { traderId, type: 'bid_received', message: '<b>Trader C</b> placed a <b>$110</b> bid on your <b>Labrador</b>', petBreedName: 'Labrador', amount: 110, counterpartyName: 'Charlie', read: false },
      { traderId, type: 'bid_outbid', message: 'Your bid on <b>Siamese</b> was outbid — new high bid <b>$78</b>', petBreedName: 'Siamese', amount: 78, counterpartyName: 'Bob', read: false },
      { traderId, type: 'bid_rejected', message: '<b>Trader B</b> rejected your bid on <b>Persian</b>', petBreedName: 'Persian', amount: 80, counterpartyName: 'Bob', read: false },
    ];
    let notifIdx = 0;

    subs.add(
      interval(8_000 + Math.random() * 7_000).subscribe(() => {
        const template = mockNotifs[notifIdx % mockNotifs.length];
        const notification: Notification = {
          ...template,
          id: `mock-notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const event: NotificationEvent = { type: 'notification', notification };
        this.events$.next(event);
        notifIdx++;
      }),
    );
  }
}
