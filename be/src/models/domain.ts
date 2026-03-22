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

export interface Listing {
  id: string;
  petId: string;
  sellerId: string;
  sellerName: string;
  askingPrice: number;
  highestBid: Bid | null;
  createdAt: string;
}

export interface Trader {
  id: string;
  name: string;
  availableCash: number;
  lockedCash: number;
  totalPortfolioValue: number;
  role: 'trader' | 'admin';
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
