import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Breed,
  Pet,
  RetailItem,
  Listing,
  Bid,
  TraderPortfolio,
  Notification as DomainNotification,
  LeaderboardEntry,
  HistoryEvent,
} from '../models/domain';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ---------------------------------------------------------------------------
  // Breeds (read-only dictionary)
  // ---------------------------------------------------------------------------
  getBreeds(): Observable<Breed[]> {
    return this.http.get<Breed[]>(`${this.apiUrl}/market/breeds`);
  }

  // ---------------------------------------------------------------------------
  // Retail market — new supply
  // ---------------------------------------------------------------------------
  getRetailItems(): Observable<RetailItem[]> {
    return this.getBreeds().pipe(
      map((breeds) =>
        breeds.map((breed) => ({
          breed,
          supplyRemaining: 10,
        })),
      ),
    );
  }

  buyNewPet(breedName: string, quantity: number): Observable<Pet[]> {
    return this.http.post<Pet>(`${this.apiUrl}/market/buy-retail`, {
      breedName,
      quantity
    }).pipe(map(pet => [pet]));
  }

  // ---------------------------------------------------------------------------
  // Trader registration
  // ---------------------------------------------------------------------------
  registerTrader(id: string, name: string, email: string): Observable<TraderPortfolio> {
    return this.http.post<TraderPortfolio>(`${this.apiUrl}/traders/register`, {
      id,
      name,
      email,
    });
  }

  // ---------------------------------------------------------------------------
  // Trader portfolio
  // ---------------------------------------------------------------------------
  getMyPortfolio(): Observable<TraderPortfolio> {
    return this.http.get<TraderPortfolio>(`${this.apiUrl}/traders/me`);
  }

  // ---------------------------------------------------------------------------
  // Trader pets
  // ---------------------------------------------------------------------------
  getMyPets(): Observable<Pet[]> {
    return this.getMyPortfolio().pipe(map((p) => p.pets));
  }

  // ---------------------------------------------------------------------------
  // Secondary market — listings
  // ---------------------------------------------------------------------------
  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.apiUrl}/market/listings`);
  }

  createListing(petId: string, askingPrice: number): Observable<Listing> {
    return this.http.post<Listing>(`${this.apiUrl}/market/list`, {
      petId,
      askingPrice,
    });
  }

  deleteListing(listingId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/market/listings/${listingId}`);
  }

  // ---------------------------------------------------------------------------
  // Bids
  // ---------------------------------------------------------------------------
  getMyBids(): Observable<Bid[]> {
    return this.getMyPortfolio().pipe(map((p) => p.bids || []));
  }

  placeBid(listingId: string, amount: number): Observable<Bid> {
    return this.http.post<Bid>(`${this.apiUrl}/market/bid`, {
      listingId,
      amount,
    });
  }

  withdrawBid(bidId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/market/bid/${bidId}/withdraw`, {});
  }

  acceptBid(bidId: string): Observable<void> {
    // FE might send bidId, but BE currently takes bidderId and listingId
    // In a real app, we'd need to look up the bid details first or update BE
    // For now, let's assume we can get it from the bid object if the caller provides it
    // or we'll just implement a simpler BE endpoint that takes bidId.
    return this.http.post<void>(`${this.apiUrl}/market/bid/accept`, {
      bidId,
    });
  }

  rejectBid(bidId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/market/bid/${bidId}/reject`, {});
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  getMyNotifications(): Observable<DomainNotification[]> {
    return this.http.get<DomainNotification[]>(`${this.apiUrl}/traders/me/notifications`);
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  // ---------------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------------
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/market/leaderboard`);
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------
  getPetHistory(petId: string): Observable<HistoryEvent[]> {
    return this.http.get<HistoryEvent[]>(`${this.apiUrl}/history/pet/${petId}`);
  }

  getMarketHistory(): Observable<HistoryEvent[]> {
    return this.http.get<HistoryEvent[]>(`${this.apiUrl}/history/market`);
  }
}
