import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Pet, Breed, Listing, Bid, Trader } from '../models/domain';
import { EventsGateway } from '../events/events.gateway';
import { TradersService } from '../traders/traders.service';
import petDictionary from '../config/pet-dictionary.json';

@Injectable()
export class MarketService {
  private readonly breeds: Map<string, Breed>;

  constructor(
    @Inject('FIRESTORE') private firestore: admin.firestore.Firestore,
    private eventsGateway: EventsGateway,
    private tradersService: TradersService,
  ) {
    this.breeds = new Map((petDictionary as any).map((b: Breed) => [b.name, b]));
  }

  private async logHistory(event: Omit<import('../models/domain').HistoryEvent, 'id' | 'createdAt'>) {
    const id = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const historyEvent = {
      ...event,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.firestore.collection('history').doc(id).set(historyEvent);
  }

  async buyFromSupply(traderId: string, breedName: string): Promise<Pet> {
    const breed = this.breeds.get(breedName);
    if (!breed) throw new Error('Breed not found');

    const trader = await this.tradersService.getTrader(traderId);
    if (!trader || trader.availableCash < breed.basePrice) {
      throw new Error('Insufficient funds');
    }

    const petId = `pet-${Date.now()}`;
    const pet: Pet = {
      id: petId,
      name: breed.displayName, // Initialize with display name, user can change later
      breedName: breed.name,
      type: breed.type,
      ownerId: traderId,
      age: 0,
      health: 100,
      lifespan: breed.lifespan,
      desirability: breed.desirability,
      maintenance: breed.maintenance,
      basePrice: breed.basePrice,
      intrinsicValue: +(breed.basePrice * (breed.desirability / 10)).toFixed(2),
      expired: false,
    };

    await this.firestore.runTransaction(async (t) => {
      // 1. Deduct cash
      await this.tradersService.updateBalances(traderId, -breed.basePrice, 0);
      // 2. Create pet
      t.set(this.firestore.collection('pets').doc(petId), pet);
    });

    await this.logHistory({
      petId,
      petName: pet.name || 'Unknown Pet',
      type: 'purchased',
      message: `Purchased ${breed.displayName} from system supply for $${breed.basePrice}`,
      amount: breed.basePrice,
    });

    return pet;
  }

  async listPet(traderId: string, petId: string, askingPrice: number): Promise<Listing> {
    const petDoc = await this.firestore.collection('pets').doc(petId).get();
    if (!petDoc.exists) throw new Error('Pet not found');
    const pet = petDoc.data() as Pet;
    if (pet.ownerId !== traderId) throw new Error('Not the owner');

    const trader = await this.tradersService.getTrader(traderId);
    if (!trader) throw new Error('Trader not found');

    const listing: Listing = {
      id: `listing-${Date.now()}`,
      petId,
      sellerId: traderId,
      sellerName: trader.name,
      askingPrice,
      highestBid: null,
      createdAt: new Date().toISOString(),
    };

    await this.firestore.collection('listings').doc(listing.id).set(listing);

    await this.logHistory({
      petId,
      petName: pet.name || 'Unknown Pet',
      type: 'listed',
      message: `Listed ${pet.name || 'Pet'} for $${askingPrice}`,
      amount: askingPrice,
    });
    
    // Broadcast new listing
    this.eventsGateway.broadcast('listing_update', { type: 'listing_update', listing });
    
    return listing;
  }

  async placeBid(bidderId: string, listingId: string, amount: number): Promise<Bid> {
    const listingRef = this.firestore.collection('listings').doc(listingId);
    const bidderRef = this.firestore.collection('traders').doc(bidderId);

    return await this.firestore.runTransaction(async (t) => {
      const listingDoc = await t.get(listingRef);
      if (!listingDoc.exists) throw new Error('Listing not found');
      const listing = listingDoc.data() as Listing;

      if (listing.sellerId === bidderId) throw new Error('Cannot bid on own listing');
      if (listing.highestBid && amount <= listing.highestBid.amount) {
        throw new Error('Bid must be higher than current highest bid');
      }

      const bidderDoc = await t.get(bidderRef);
      if (!bidderDoc.exists) throw new Error('Bidder not found');
      const bidder = bidderDoc.data() as Trader;

      if (bidder.availableCash < amount) throw new Error('Insufficient cash');

      // 1. If there's an existing highest bid, refund the previous bidder
      if (listing.highestBid) {
        const prevBidderRef = this.firestore.collection('traders').doc(listing.highestBid.bidderId);
        const prevBidderDoc = await t.get(prevBidderRef);
        const prevBidder = prevBidderDoc.data() as Trader;
        t.update(prevBidderRef, {
          availableCash: +(prevBidder.availableCash + listing.highestBid.amount).toFixed(2),
          lockedCash: +(prevBidder.lockedCash - listing.highestBid.amount).toFixed(2),
        });

        // Notify previous bidder
        this.eventsGateway.sendToTrader(listing.highestBid.bidderId, 'notification', {
          type: 'notification',
          notification: {
            id: `notif-${Date.now()}`,
            traderId: listing.highestBid.bidderId,
            type: 'bid_outbid',
            message: `Your bid on ${listing.highestBid.petBreedName} was outbid — new high bid $${amount}`,
            petBreedName: listing.highestBid.petBreedName,
            amount,
            counterpartyName: bidder.name,
            read: false,
            createdAt: new Date().toISOString(),
          }
        });
      }

      // 2. Create the new bid
      const petRef = this.firestore.collection('pets').doc(listing.petId);
      const petDoc = await t.get(petRef);
      if (!petDoc.exists) throw new Error('Pet not found');
      const pet = petDoc.data() as Pet;

      const bid: Bid = {
        id: `bid-${Date.now()}`,
        listingId,
        petId: listing.petId,
        petBreedName: pet.breedName,
        bidderId,
        bidderName: bidder.name,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        amount,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // 3. Lock bidder's cash
      t.update(bidderRef, {
        availableCash: +(bidder.availableCash - amount).toFixed(2),
        lockedCash: +(bidder.lockedCash + amount).toFixed(2),
      });

      // 4. Update listing
      t.update(listingRef, { highestBid: bid });

    // 5. Notify seller
    const notification = {
      id: `notif-${Date.now()}-seller`,
      traderId: listing.sellerId,
      type: 'bid_received',
      message: `${bidder.name} placed a $${amount} bid on your pet`,
      petBreedName: bid.petBreedName,
      amount,
      counterpartyName: bidder.name,
      read: false,
      createdAt: new Date().toISOString(),
    };
    t.set(this.firestore.collection('notifications').doc(notification.id), notification);
    this.eventsGateway.sendToTrader(listing.sellerId, 'notification', {
      type: 'notification',
      notification,
    });

    await this.logHistory({
      petId: listing.petId,
      petName: pet.name || 'Unknown Pet',
      type: 'bid',
      message: `${bidder.name} placed a $${amount} bid on ${pet.name || 'Pet'}`,
      amount,
      counterpartyId: bidderId,
      counterpartyName: bidder.name,
    });

    return bid;
  });
}

async acceptBid(bidderId: string, listingId: string): Promise<void> {
  const listingRef = this.firestore.collection('listings').doc(listingId);
  await this.firestore.runTransaction(async (t) => {
    const listingDoc = await t.get(listingRef);
    if (!listingDoc.exists) throw new Error('Listing not found');
    const listing = listingDoc.data() as Listing;
    const bid = listing.highestBid;
    if (!bid || bid.bidderId !== bidderId) throw new Error('Invalid bid');

    const petRef = this.firestore.collection('pets').doc(listing.petId);
    const petDoc = await t.get(petRef);
    const pet = petDoc.data() as Pet;

    const sellerRef = this.firestore.collection('traders').doc(listing.sellerId);
    const sellerDoc = await t.get(sellerRef);
    const seller = sellerDoc.data() as Trader;

    const bidderRef = this.firestore.collection('traders').doc(bid.bidderId);
    const bidderDoc = await t.get(bidderRef);
    const bidder = bidderDoc.data() as Trader;

    // 1. Transfer pet ownership
    t.update(petRef, { ownerId: bid.bidderId });

    // 2. Transfer cash
    t.update(sellerRef, {
      availableCash: +(seller.availableCash + bid.amount).toFixed(2),
    });
    t.update(bidderRef, {
      lockedCash: +(bidder.lockedCash - bid.amount).toFixed(2),
    });

    // 3. Delete listing
    t.delete(listingRef);

    // 4. Record as Bid (Update status)
    const bidRef = this.firestore.collection('bids').doc(bid.id);
    t.set(bidRef, { ...bid, status: 'accepted' });

    // 5. Notify both parties
    const sellerNotif = {
      id: `notif-${Date.now()}-sacc`,
      traderId: listing.sellerId,
      type: 'pet_sold',
      message: `You sold ${pet.name} for $${bid.amount}`,
      petBreedName: bid.petBreedName,
      amount: bid.amount,
      counterpartyName: bid.bidderName,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await this.logHistory({
      petId: pet.id,
      petName: pet.name || 'Unknown Pet',
      type: 'sold',
      message: `${seller.name} sold ${pet.name || 'Pet'} to ${bidder.name} for $${bid.amount}`,
      amount: bid.amount,
      counterpartyId: bidder.id,
      counterpartyName: bidder.name,
    });
    const bidderNotif = {
      id: `notif-${Date.now()}-bacc`,
      traderId: bid.bidderId,
      type: 'bid_accepted',
      message: `Your bid for $${bid.amount} was accepted`,
      petBreedName: bid.petBreedName,
      amount: bid.amount,
      counterpartyName: listing.sellerName,
      read: false,
      createdAt: new Date().toISOString(),
    };
    t.set(this.firestore.collection('notifications').doc(sellerNotif.id), sellerNotif);
    t.set(this.firestore.collection('notifications').doc(bidderNotif.id), bidderNotif);

    this.eventsGateway.sendToTrader(listing.sellerId, 'notification', { type: 'notification', notification: sellerNotif });
    this.eventsGateway.sendToTrader(bid.bidderId, 'notification', { type: 'notification', notification: bidderNotif });
    this.eventsGateway.broadcast('listing_removed', { type: 'listing_removed', listingId });
  });
}
}
