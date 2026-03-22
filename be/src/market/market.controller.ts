import { Controller, Get, Post, Body, Param, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import { MarketService } from './market.service';
import { Breed, Listing } from '../models/domain';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import petDictionary from '../config/pet-dictionary.json';

@ApiTags('market')
@Controller('market')
export class MarketController {
  private readonly breeds: Breed[];

  constructor(
    private marketService: MarketService,
    @Inject('FIRESTORE') private firestore: admin.firestore.Firestore,
  ) {
    this.breeds = petDictionary as any;
  }

  @Get('breeds')
  @ApiOperation({ summary: 'Get all available pet breeds' })
  async getBreeds() {
    return this.breeds;
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get all active secondary market listings' })
  async getListings() {
    const snapshot = await this.firestore.collection('listings').get();
    const listings: Listing[] = [];
    snapshot.forEach(doc => listings.push(doc.data() as Listing));
    return listings;
  }

  @Post('buy-retail')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy a new pet from the system supply' })
  async buyRetailPet(@CurrentUser() traderId: string, @Body() body: { breedName: string }) {
    return this.marketService.buyFromSupply(traderId, body.breedName);
  }

  @Post('list')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List a pet for sale on the secondary market' })
  async listPet(@CurrentUser() traderId: string, @Body() body: { petId: string; askingPrice: number }) {
    return this.marketService.listPet(traderId, body.petId, body.askingPrice);
  }

  @Post('bid')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bid on a listed pet' })
  async placeBid(@CurrentUser() bidderId: string, @Body() body: { listingId: string; amount: number }) {
    return this.marketService.placeBid(bidderId, body.listingId, body.amount);
  }

  @Post('bid/accept')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a bid on your pet' })
  async acceptBid(@CurrentUser() sellerId: string, @Body() body: { bidId: string }) {
    // Look up the bid from Firestore first
    const bidDoc = await this.firestore.collection('bids').doc(body.bidId).get();
    let bidData: any;

    if (!bidDoc.exists) {
      // It might be in the listing's highestBid
      const listings = await this.firestore.collection('listings')
        .where('highestBid.id', '==', body.bidId).get();
      if (!listings.empty) {
        const listing = listings.docs[0].data();
        bidData = listing.highestBid;
      } else {
        throw new Error('Bid not found');
      }
    } else {
      bidData = bidDoc.data();
    }

    if (!bidData) throw new Error('Bid data is missing');
    
    // Security check: Only the seller can accept the bid
    if (bidData.sellerId !== sellerId) {
      throw new Error('Only the seller can accept this bid');
    }

    return this.marketService.acceptBid(bidData.bidderId, bidData.listingId);
  }

  @Post('bid/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw a bid (placeholder)' })
  async withdrawBid(@Param('id') id: string) {
    // Placeholder for withdraw logic in MarketService if needed
    // For now, let's just delete the bid and refund cash if it was highest
    // Implementation should ideally be in MarketService
    return { success: true, message: 'Bid withdrawn' };
  }

  @Post('bid/:id/reject')
  @ApiOperation({ summary: 'Reject a bid (placeholder)' })
  async rejectBid(@Param('id') id: string) {
    // Similar to withdraw but initiated by seller
    return { success: true, message: 'Bid rejected' };
  }

  @Post('list/:id/delete')
  @ApiOperation({ summary: 'Remove a listing from market' })
  async deleteListing(@Param('id') id: string) {
    await this.firestore.collection('listings').doc(id).delete();
    return { success: true };
  }

  @Post('listings/:id/delete') // Alternative for compatibility
  @ApiOperation({ summary: 'Remove a listing from market (alt)' })
  async deleteListingAlt(@Param('id') id: string) {
    await this.firestore.collection('listings').doc(id).delete();
    return { success: true };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global trader leaderboard' })
  async getLeaderboard() {
    const snapshot = await this.firestore.collection('traders')
      .limit(10)
      .get();
    const leaderboard: any[] = [];
    snapshot.forEach(doc => leaderboard.push(doc.data()));
    
    // Sort in memory to avoid Firestore index requirement
    leaderboard.sort((a, b) => (b.totalPortfolioValue || 0) - (a.totalPortfolioValue || 0));
    
    return leaderboard;
  }
}
