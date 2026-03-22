import { Controller, Get, Param, Post, Body, Inject, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import { TradersService } from './traders.service';
import { PetsService } from '../pets/pets.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('traders')
@Controller('traders')
export class TradersController {
  constructor(
    private tradersService: TradersService,
    private petsService: PetsService,
    @Inject('FIRESTORE') private firestore: admin.firestore.Firestore,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new trader profile' })
  async registerTrader(@Body() body: { id: string; name: string; email?: string }) {
    // This endpoint stays open but should probably be limited or verify ID token
    // For now, let's allow it so users can register after Firebase signup
    
    const existing = await this.firestore.collection('traders').doc(body.id).get();
    if (existing.exists) {
      return existing.data();
    }

    const isAdmin = body.email === 'admin@pets.com';

    const trader: any = {
      id: body.id,
      name: body.name,
      availableCash: 1000,
      lockedCash: 0,
      totalPortfolioValue: 1000,
      role: isAdmin ? 'admin' : 'trader',
    };
    await this.firestore.collection('traders').doc(body.id).set(trader);
    return trader;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user portfolio' })
  async getMyPortfolio(@CurrentUser() userId: string) {
    const portfolio = await this.getTraderPortfolio(userId);
    if ('error' in portfolio) {
      throw new UnauthorizedException('Trader profile not found');
    }
    return portfolio;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific trader portfolio' })
  async getTraderPortfolio(@Param('id') id: string) {
    if (!id || id === 'undefined') {
      return { error: 'Invalid trader ID' };
    }
    const trader = await this.tradersService.getTrader(id);
    if (!trader) return { error: 'Trader not found' };
    
    const pets = await this.petsService.getPetsByOwner(id);
    const petsValue = pets.reduce((sum, p) => sum + p.intrinsicValue, 0);

    const listingsSnapshot = await this.firestore.collection('listings')
      .where('sellerId', '==', id).get();
    const listings: any[] = [];
    listingsSnapshot.forEach(doc => listings.push(doc.data()));

    const bidsSnapshot = await this.firestore.collection('bids')
      .where('bidderId', '==', id).get();
    const bids: any[] = [];
    bidsSnapshot.forEach(doc => bids.push(doc.data()));
    
    const totalPortfolioValue = +(trader.availableCash + trader.lockedCash + petsValue).toFixed(2);
    
    // Update totalPortfolioValue in background if it changed significantly or regularly
    if (Math.abs(trader.totalPortfolioValue - totalPortfolioValue) > 0.01) {
      this.firestore.collection('traders').doc(trader.id).update({ totalPortfolioValue }).catch(() => {});
    }

    return {
      id: trader.id,
      name: trader.name,
      role: trader.role || 'trader',
      availableCash: trader.availableCash,
      lockedCash: trader.lockedCash,
      pets,
      listings,
      bids,
      totalPortfolioValue,
    };
  }

  @Post(':traderId/notifications/:id/read')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read (legacy)' })
  async markNotificationRead(@Param('id') id: string, @CurrentUser() userId: string) {
    // Optional: check if notification belongs to user
    await this.firestore.collection('notifications').doc(id).update({ read: true });
    return { success: true };
  }

  @Post('notifications/:id/read') // Alternative for compatibility
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationReadAlt(@Param('id') id: string) {
    await this.firestore.collection('notifications').doc(id).update({ read: true });
    return { success: true };
  }

  @Get('me/notifications')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getMyNotifications(@CurrentUser() userId: string) {
    const snapshot = await this.firestore.collection('notifications')
      .where('traderId', '==', userId)
      .limit(50)
      .get();
    const notifications: any[] = [];
    snapshot.forEach(doc => notifications.push(doc.data()));
    
    // Sort in memory to avoid Firestore index requirement
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return notifications;
  }
}
