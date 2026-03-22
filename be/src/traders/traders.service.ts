import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Trader, Pet } from '../models/domain';

@Injectable()
export class TradersService {
  constructor(
    @Inject('FIRESTORE') private firestore: admin.firestore.Firestore,
  ) {}

  async getTrader(id: string): Promise<Trader | null> {
    const doc = await this.firestore.collection('traders').doc(id).get();
    return doc.exists ? (doc.data() as Trader) : null;
  }

  async updateTraderPortfolio(traderId: string, pets: Pet[]) {
    const trader = await this.getTrader(traderId);
    if (!trader) return;

    const petsValue = pets.reduce((sum, p) => sum + p.intrinsicValue, 0);
    const totalPortfolioValue = +(trader.availableCash + trader.lockedCash + petsValue).toFixed(2);

    await this.firestore.collection('traders').doc(traderId).update({
      totalPortfolioValue,
    });
  }

  async updateBalances(traderId: string, availableDelta: number, lockedDelta: number) {
    const docRef = this.firestore.collection('traders').doc(traderId);
    await this.firestore.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) throw new Error('Trader not found');
      const data = doc.data() as Trader;
      
      const newAvailable = +(data.availableCash + availableDelta).toFixed(2);
      const newLocked = +(data.lockedCash + lockedDelta).toFixed(2);
      
      if (newAvailable < 0) throw new Error('Insufficient cash');

      t.update(docRef, {
        availableCash: newAvailable,
        lockedCash: newLocked,
      });
    });
  }
}
