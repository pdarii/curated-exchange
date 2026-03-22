// ---------------------------------------------------------------------------
// Pet Types & Breeds
// ---------------------------------------------------------------------------
export type PetType = 'Dog' | 'Cat' | 'Bird' | 'Fish';

export interface Breed {
  name: string;
  displayName: string;
  type: PetType;
  lifespan: number;
  desirability: number;
  maintenance: number;
  basePrice: number;
}

// ---------------------------------------------------------------------------
// Pets
// ---------------------------------------------------------------------------
export interface Pet {
  id: string;
  name: string;
  breedName: string;
  type: PetType;
  ownerId: string;
  age: number;
  health: number;
  lifespan: number;
  desirability: number;
  maintenance: number;
  basePrice: number;
  intrinsicValue: number;
  expired: boolean;
}

// ---------------------------------------------------------------------------
// Market — Retail (new supply) & Secondary (player listings)
// ---------------------------------------------------------------------------
export interface RetailItem {
  breed: Breed;
  supplyRemaining: number;
}

export interface Listing {
  id: string;
  petId: string;
  pet: Pet;
  sellerId: string;
  sellerName: string;
  askingPrice: number;
  highestBid: Bid | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------
export type BidStatus = 'active' | 'accepted' | 'rejected' | 'withdrawn' | 'outbid';

export interface Bid {
  id: string;
  listingId: string;
  petId: string;
  petBreedName: string;
  bidderId: string;
  bidderName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: BidStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Trader
// ---------------------------------------------------------------------------
export interface Trader {
  id: string;
  name: string;
  role: 'trader' | 'admin';
  availableCash: number;
  lockedCash: number;
  totalPortfolioValue: number;
}

export type HistoryType =
  | 'minted'
  | 'listed'
  | 'bid'
  | 'sold'
  | 'outbid'
  | 'rejected'
  | 'withdrawn'
  | 'purchased';

export interface HistoryEvent {
  id: string;
  petId: string;
  petName?: string;
  type: HistoryType;
  message: string;
  amount?: number;
  counterpartyId?: string;
  counterpartyName?: string;
  createdAt: string;
}

export interface TraderPortfolio {
  id: string;
  name: string;
  role: 'trader' | 'admin';
  availableCash: number;
  lockedCash: number;
  totalPortfolioValue: number;
  pets: Pet[];
  bids: Bid[];
  listings: Listing[];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export type NotificationType =
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_withdrawn'
  | 'bid_outbid'
  | 'pet_purchased'
  | 'pet_sold';

export interface Notification {
  id: string;
  traderId: string;
  type: NotificationType;
  message: string;
  petBreedName: string;
  amount: number | null;
  counterpartyName: string | null;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
export interface LeaderboardEntry {
  rank: number;
  traderId: string;
  traderName: string;
  availableCash: number;
  lockedCash: number;
  petsMarketValue: number;
  totalPortfolioValue: number;
}
