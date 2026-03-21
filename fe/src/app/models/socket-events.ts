import { Bid, Notification, Pet, Listing, LeaderboardEntry } from './domain';

// ---------------------------------------------------------------------------
// Socket event types — all real-time pushes from the server
// ---------------------------------------------------------------------------

export type SocketEventType =
  | 'pet_stats_update'
  | 'bid_update'
  | 'listing_update'
  | 'listing_removed'
  | 'trade_completed'
  | 'notification'
  | 'leaderboard_update'
  | 'cash_update';

// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

/** Health & age tick for one or more pets */
export interface PetStatsUpdateEvent {
  type: 'pet_stats_update';
  pets: Pick<Pet, 'id' | 'age' | 'health' | 'intrinsicValue' | 'expired'>[];
}

/** A bid was placed, outbid, accepted, rejected, or withdrawn */
export interface BidUpdateEvent {
  type: 'bid_update';
  bid: Bid;
}

/** A listing was created or its highest bid changed */
export interface ListingUpdateEvent {
  type: 'listing_update';
  listing: Listing;
}

/** A listing was removed (delisted or trade completed) */
export interface ListingRemovedEvent {
  type: 'listing_removed';
  listingId: string;
}

/** A trade completed — pet changed hands */
export interface TradeCompletedEvent {
  type: 'trade_completed';
  petId: string;
  fromTraderId: string;
  toTraderId: string;
  price: number;
}

/** New notification for a trader */
export interface NotificationEvent {
  type: 'notification';
  notification: Notification;
}

/** Leaderboard recalculated */
export interface LeaderboardUpdateEvent {
  type: 'leaderboard_update';
  entries: LeaderboardEntry[];
}

/** Cash balance changed for a trader */
export interface CashUpdateEvent {
  type: 'cash_update';
  traderId: string;
  availableCash: number;
  lockedCash: number;
}

export type SocketEvent =
  | PetStatsUpdateEvent
  | BidUpdateEvent
  | ListingUpdateEvent
  | ListingRemovedEvent
  | TradeCompletedEvent
  | NotificationEvent
  | LeaderboardUpdateEvent
  | CashUpdateEvent;
