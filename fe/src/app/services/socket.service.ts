import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  SocketEvent,
  PetStatsUpdateEvent,
  BidUpdateEvent,
  ListingUpdateEvent,
  ListingRemovedEvent,
  TradeCompletedEvent,
  NotificationEvent,
  LeaderboardUpdateEvent,
  CashUpdateEvent,
} from '../models/socket-events';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private events$ = new Subject<SocketEvent>();

  // -------------------------------------------------------------------------
  // Connect / disconnect
  // -------------------------------------------------------------------------

  connect(traderId: string): void {
    this.disconnect();

    this.socket = io(environment.wsUrl, {
      query: { traderId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
    });

    this.socket.onAny((eventName, data) => {
      // Assuming server sends objects that can be mapped to SocketEvent
      // We need to inject the 'type' if it's not there, but backend's 'broadcast' and 'sendToTrader'
      // use the event name as the first argument.
      // If server does: this.server.emit('pet_stats_update', { pets: [...] })
      // then data is { pets: [...] } and eventName is 'pet_stats_update'.
      this.events$.next({ type: eventName, ...data } as SocketEvent);
    });

    this.socket.on('disconnect', (reason) => {
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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
}
