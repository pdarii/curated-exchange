import { Controller, Get, Param, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import { HistoryEvent } from '../models/domain';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('history')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('history')
export class HistoryController {
  constructor(@Inject('FIRESTORE') private firestore: admin.firestore.Firestore) {}

  @Get('pet/:id')
  @ApiOperation({ summary: 'Get transaction history for a specific pet' })
  async getPetHistory(@Param('id') petId: string): Promise<HistoryEvent[]> {
    const snapshot = await this.firestore
      .collection('history')
      .where('petId', '==', petId)
      .get();
    
    const events: HistoryEvent[] = [];
    snapshot.forEach((doc) => events.push(doc.data() as HistoryEvent));
    
    // Sort in memory because Firestore requires index for complex filters + order
    return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  @Get('market')
  @ApiOperation({ summary: 'Get global market transaction feed' })
  async getMarketHistory(): Promise<HistoryEvent[]> {
    const snapshot = await this.firestore
      .collection('history')
      .limit(50)
      .get();
    
    const events: HistoryEvent[] = [];
    snapshot.forEach((doc) => events.push(doc.data() as HistoryEvent));
    
    return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }
}
