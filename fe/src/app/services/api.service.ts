import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  Breed,
  Pet,
  RetailItem,
  Listing,
  Bid,
  TraderPortfolio,
  Notification,
  LeaderboardEntry,
} from '../models/domain';
import { MOCK_BREEDS, MOCK_PETS, MOCK_LISTINGS, MOCK_BIDS, MOCK_NOTIFICATIONS } from './mock-data';

const FAKE_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class ApiService {
  // ---------------------------------------------------------------------------
  // Breeds (read-only dictionary)
  // ---------------------------------------------------------------------------
  getBreeds(): Observable<Breed[]> {
    return of(MOCK_BREEDS).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Retail market — new supply
  // ---------------------------------------------------------------------------
  getRetailItems(): Observable<RetailItem[]> {
    const items: RetailItem[] = MOCK_BREEDS.map((breed) => ({
      breed,
      supplyRemaining: Math.floor(Math.random() * 10) + 1,
    }));
    return of(items).pipe(delay(FAKE_DELAY));
  }

  buyRetailPet(breedName: string, traderId: string, quantity: number): Observable<Pet[]> {
    const breed = MOCK_BREEDS.find((b) => b.name === breedName)!;
    const pets: Pet[] = Array.from({ length: quantity }, (_, i) => ({
      id: `pet-${Date.now()}-${i}`,
      breedName: breed.name,
      type: breed.type,
      ownerId: traderId,
      age: 0,
      health: 100,
      lifespan: breed.lifespan,
      desirability: breed.desirability,
      maintenance: breed.maintenance,
      basePrice: breed.basePrice,
      intrinsicValue: breed.basePrice * (breed.desirability / 10),
      expired: false,
    }));
    return of(pets).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Trader portfolio
  // ---------------------------------------------------------------------------
  getTraderPortfolio(traderId: string): Observable<TraderPortfolio> {
    const pets = MOCK_PETS.filter((p) => p.ownerId === traderId);
    const bids = MOCK_BIDS.filter((b) => b.bidderId === traderId);
    const listings = MOCK_LISTINGS.filter((l) => l.sellerId === traderId);
    const petsValue = pets.reduce((sum, p) => sum + p.intrinsicValue, 0);
    const lockedCash = bids
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.amount, 0);

    const cashMap: Record<string, number> = {
      'trader-a': 450,
      'trader-b': 320,
      'trader-c': 280,
    };

    const nameMap: Record<string, string> = {
      'trader-a': 'Alice',
      'trader-b': 'Bob',
      'trader-c': 'Charlie',
    };

    const portfolio: TraderPortfolio = {
      traderId,
      traderName: nameMap[traderId] ?? traderId,
      availableCash: cashMap[traderId] ?? 500,
      lockedCash,
      totalPortfolioValue: (cashMap[traderId] ?? 500) + lockedCash + petsValue,
      pets,
      bids,
      listings,
    };
    return of(portfolio).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Trader pets
  // ---------------------------------------------------------------------------
  getTraderPets(traderId: string): Observable<Pet[]> {
    return of(MOCK_PETS.filter((p) => p.ownerId === traderId)).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Secondary market — listings
  // ---------------------------------------------------------------------------
  getListings(): Observable<Listing[]> {
    return of(MOCK_LISTINGS).pipe(delay(FAKE_DELAY));
  }

  createListing(petId: string, askingPrice: number): Observable<Listing> {
    const pet = MOCK_PETS.find((p) => p.id === petId)!;
    const listing: Listing = {
      id: `listing-${Date.now()}`,
      petId,
      pet,
      sellerId: pet.ownerId,
      sellerName: pet.ownerId,
      askingPrice,
      highestBid: null,
      createdAt: new Date().toISOString(),
    };
    return of(listing).pipe(delay(FAKE_DELAY));
  }

  deleteListing(listingId: string): Observable<void> {
    return of(undefined).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Bids
  // ---------------------------------------------------------------------------
  getTraderBids(traderId: string): Observable<Bid[]> {
    return of(MOCK_BIDS.filter((b) => b.bidderId === traderId)).pipe(delay(FAKE_DELAY));
  }

  placeBid(listingId: string, amount: number, bidderId: string): Observable<Bid> {
    const listing = MOCK_LISTINGS.find((l) => l.id === listingId)!;
    const bid: Bid = {
      id: `bid-${Date.now()}`,
      listingId,
      petId: listing.petId,
      petBreedName: listing.pet.breedName,
      bidderId,
      bidderName: bidderId,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      amount,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    return of(bid).pipe(delay(FAKE_DELAY));
  }

  withdrawBid(bidId: string): Observable<void> {
    return of(undefined).pipe(delay(FAKE_DELAY));
  }

  acceptBid(bidId: string): Observable<void> {
    return of(undefined).pipe(delay(FAKE_DELAY));
  }

  rejectBid(bidId: string): Observable<void> {
    return of(undefined).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  getNotifications(traderId: string): Observable<Notification[]> {
    return of(MOCK_NOTIFICATIONS.filter((n) => n.traderId === traderId)).pipe(delay(FAKE_DELAY));
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return of(undefined).pipe(delay(FAKE_DELAY));
  }

  // ---------------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------------
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    const entries: LeaderboardEntry[] = [
      {
        rank: 1,
        traderId: 'trader-a',
        traderName: 'Alice',
        availableCash: 450,
        lockedCash: 55,
        petsMarketValue: 187.6,
        totalPortfolioValue: 692.6,
      },
      {
        rank: 2,
        traderId: 'trader-b',
        traderName: 'Bob',
        availableCash: 320,
        lockedCash: 0,
        petsMarketValue: 182.88,
        totalPortfolioValue: 502.88,
      },
      {
        rank: 3,
        traderId: 'trader-c',
        traderName: 'Charlie',
        availableCash: 280,
        lockedCash: 90,
        petsMarketValue: 86.73,
        totalPortfolioValue: 456.73,
      },
    ];
    return of(entries).pipe(delay(FAKE_DELAY));
  }
}
