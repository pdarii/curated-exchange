import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './firebase/firebase.module';
import { EventsGateway } from './events/events.gateway';
import { PetsService } from './pets/pets.service';
import { TradersService } from './traders/traders.service';
import { MarketService } from './market/market.service';
import { TradersController } from './traders/traders.controller';
import { MarketController } from './market/market.controller';
import { HistoryController } from './history/history.controller';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    FirebaseModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    TradersController,
    MarketController,
    HistoryController,
  ],
  providers: [
    EventsGateway,
    PetsService,
    TradersService,
    MarketService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
