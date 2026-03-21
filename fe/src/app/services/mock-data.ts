import { Breed, Pet, Listing, Bid, Notification } from '../models/domain';

// ---------------------------------------------------------------------------
// Helper: compute intrinsic value
// ---------------------------------------------------------------------------
function intrinsicValue(
  basePrice: number,
  health: number,
  desirability: number,
  age: number,
  lifespan: number,
): number {
  const ageFactor = Math.max(0, 1 - age / lifespan);
  return +(basePrice * (health / 100) * (desirability / 10) * ageFactor).toFixed(2);
}

// ---------------------------------------------------------------------------
// 20 Breeds (read-only dictionary)
// ---------------------------------------------------------------------------
export const MOCK_BREEDS: Breed[] = [
  { name: 'Labrador', type: 'Dog', lifespan: 12, desirability: 8, maintenance: 5, basePrice: 100 },
  { name: 'Beagle', type: 'Dog', lifespan: 13, desirability: 7, maintenance: 4, basePrice: 90 },
  { name: 'Poodle', type: 'Dog', lifespan: 14, desirability: 9, maintenance: 6, basePrice: 110 },
  { name: 'Bulldog', type: 'Dog', lifespan: 10, desirability: 6, maintenance: 7, basePrice: 80 },
  {
    name: 'Pit Bull',
    type: 'Dog',
    lifespan: 11,
    desirability: 5,
    maintenance: 5,
    basePrice: 70,
  },
  { name: 'Siamese', type: 'Cat', lifespan: 15, desirability: 9, maintenance: 4, basePrice: 90 },
  { name: 'Persian', type: 'Cat', lifespan: 14, desirability: 8, maintenance: 6, basePrice: 85 },
  {
    name: 'Maine Coon',
    type: 'Cat',
    lifespan: 16,
    desirability: 7,
    maintenance: 5,
    basePrice: 80,
  },
  { name: 'Bengal', type: 'Cat', lifespan: 12, desirability: 6, maintenance: 5, basePrice: 75 },
  { name: 'Sphynx', type: 'Cat', lifespan: 13, desirability: 5, maintenance: 7, basePrice: 70 },
  {
    name: 'Parakeet',
    type: 'Bird',
    lifespan: 8,
    desirability: 7,
    maintenance: 3,
    basePrice: 25,
  },
  { name: 'Canary', type: 'Bird', lifespan: 10, desirability: 6, maintenance: 2, basePrice: 20 },
  {
    name: 'Cockatiel',
    type: 'Bird',
    lifespan: 12,
    desirability: 8,
    maintenance: 3,
    basePrice: 30,
  },
  { name: 'Macaw', type: 'Bird', lifespan: 50, desirability: 9, maintenance: 8, basePrice: 120 },
  {
    name: 'Lovebird',
    type: 'Bird',
    lifespan: 15,
    desirability: 5,
    maintenance: 3,
    basePrice: 15,
  },
  {
    name: 'Goldfish',
    type: 'Fish',
    lifespan: 10,
    desirability: 5,
    maintenance: 2,
    basePrice: 5,
  },
  { name: 'Betta', type: 'Fish', lifespan: 5, desirability: 6, maintenance: 1, basePrice: 6 },
  { name: 'Guppy', type: 'Fish', lifespan: 3, desirability: 4, maintenance: 1, basePrice: 4 },
  {
    name: 'Angelfish',
    type: 'Fish',
    lifespan: 8,
    desirability: 7,
    maintenance: 2,
    basePrice: 8,
  },
  {
    name: 'Clownfish',
    type: 'Fish',
    lifespan: 6,
    desirability: 8,
    maintenance: 3,
    basePrice: 10,
  },
];

// ---------------------------------------------------------------------------
// Mock Pets (from sample scenario in design prompt)
// ---------------------------------------------------------------------------
function makePet(
  id: string,
  breedName: string,
  ownerId: string,
  age: number,
  health: number,
): Pet {
  const breed = MOCK_BREEDS.find((b) => b.name === breedName)!;
  const expired = age >= breed.lifespan;
  return {
    id,
    breedName: breed.name,
    type: breed.type,
    ownerId,
    age,
    health,
    lifespan: breed.lifespan,
    desirability: breed.desirability,
    maintenance: breed.maintenance,
    basePrice: breed.basePrice,
    intrinsicValue: expired ? 0 : intrinsicValue(breed.basePrice, health, breed.desirability, age, breed.lifespan),
    expired,
  };
}

export const MOCK_PETS: Pet[] = [
  // Trader A
  makePet('pet-a1', 'Labrador', 'trader-a', 2.1, 88),
  makePet('pet-a2', 'Poodle', 'trader-a', 0.5, 95),
  makePet('pet-a3', 'Goldfish', 'trader-a', 1.3, 72),

  // Trader B
  makePet('pet-b1', 'Siamese', 'trader-b', 1.8, 91),
  makePet('pet-b2', 'Macaw', 'trader-b', 3.2, 85),

  // Trader C
  makePet('pet-c1', 'Beagle', 'trader-c', 0.3, 97),
  makePet('pet-c2', 'Bengal', 'trader-c', 4.1, 63),
  makePet('pet-c3', 'Parakeet', 'trader-c', 2.0, 78),
  makePet('pet-c4', 'Betta', 'trader-c', 1.5, 66),
];

// ---------------------------------------------------------------------------
// Mock Bids
// ---------------------------------------------------------------------------
export const MOCK_BIDS: Bid[] = [
  {
    id: 'bid-1',
    listingId: 'listing-1',
    petId: 'pet-a2',
    petBreedName: 'Poodle',
    bidderId: 'trader-b',
    bidderName: 'Bob',
    sellerId: 'trader-a',
    sellerName: 'Alice',
    amount: 55,
    status: 'active',
    createdAt: '2026-03-21T10:30:00Z',
  },
  {
    id: 'bid-2',
    listingId: 'listing-2',
    petId: 'pet-c2',
    petBreedName: 'Bengal',
    bidderId: 'trader-a',
    bidderName: 'Alice',
    sellerId: 'trader-c',
    sellerName: 'Charlie',
    amount: 45,
    status: 'active',
    createdAt: '2026-03-21T11:00:00Z',
  },
  {
    id: 'bid-3',
    listingId: 'listing-2',
    petId: 'pet-c2',
    petBreedName: 'Bengal',
    bidderId: 'trader-b',
    bidderName: 'Bob',
    sellerId: 'trader-c',
    sellerName: 'Charlie',
    amount: 40,
    status: 'outbid',
    createdAt: '2026-03-21T10:45:00Z',
  },
];

// ---------------------------------------------------------------------------
// Mock Listings
// ---------------------------------------------------------------------------
export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    petId: 'pet-a2',
    pet: MOCK_PETS.find((p) => p.id === 'pet-a2')!,
    sellerId: 'trader-a',
    sellerName: 'Alice',
    askingPrice: 120,
    highestBid: MOCK_BIDS.find((b) => b.id === 'bid-1')!,
    createdAt: '2026-03-21T09:00:00Z',
  },
  {
    id: 'listing-2',
    petId: 'pet-c2',
    pet: MOCK_PETS.find((p) => p.id === 'pet-c2')!,
    sellerId: 'trader-c',
    sellerName: 'Charlie',
    askingPrice: 85,
    highestBid: MOCK_BIDS.find((b) => b.id === 'bid-2')!,
    createdAt: '2026-03-21T09:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Mock Notifications
// ---------------------------------------------------------------------------
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    traderId: 'trader-a',
    type: 'bid_received',
    message: 'Bob placed a $55 bid on your Poodle',
    petBreedName: 'Poodle',
    amount: 55,
    counterpartyName: 'Bob',
    read: false,
    createdAt: '2026-03-21T10:30:00Z',
  },
  {
    id: 'notif-2',
    traderId: 'trader-b',
    type: 'bid_outbid',
    message: 'Your bid on Bengal was outbid by Alice ($45)',
    petBreedName: 'Bengal',
    amount: 45,
    counterpartyName: 'Alice',
    read: false,
    createdAt: '2026-03-21T11:00:00Z',
  },
  {
    id: 'notif-3',
    traderId: 'trader-c',
    type: 'bid_received',
    message: 'Alice placed a $45 bid on your Bengal',
    petBreedName: 'Bengal',
    amount: 45,
    counterpartyName: 'Alice',
    read: true,
    createdAt: '2026-03-21T11:00:00Z',
  },
  {
    id: 'notif-4',
    traderId: 'trader-a',
    type: 'pet_purchased',
    message: 'You purchased a Goldfish from the retail market',
    petBreedName: 'Goldfish',
    amount: 5,
    counterpartyName: null,
    read: true,
    createdAt: '2026-03-21T08:15:00Z',
  },
];
