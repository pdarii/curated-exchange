# Pets Trading System - Backend Implementation Plan

This document outlines the step-by-step implementation of the NestJS backend for the Pets Trading System, based on the requirements in `documentation/ANH-Pets Trading System-200326-181106.pdf`.

## Phase 1: Environment & Infrastructure
1.  **Dependency Setup**:
    -   Install: `firebase-admin`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `@nestjs/schedule` (for cron).
2.  **Firebase Integration**:
    -   Create `FirebaseModule` in `be/src/firebase/`.
    -   Initialize `firebase-admin` using `be/service-account.json`.
    -   Provide `Firestore` and `Auth` (if needed) as injectable providers.
3.  **WebSocket Gateway**:
    -   Implement `EventsGateway` in `be/src/events/`.
    -   Handle client connections and room joining (for private trader notifications).

## Phase 2: Data Models & Configuration (COMPLETED)
1.  **Define Interfaces/DTOs**:
    -   `Trader`: id, name, availableCash, lockedCash, inventory (Pet IDs).
    -   `Pet`: id, breed, type, lifespan, desirability (1-10), maintenanceCost, health (0-100), age, ownerId, basePrice.
    -   `Listing`: id, petId, sellerId, askingPrice, activeBids[].
2.  **Initialize Configuration**:
    -   Moved Pet Dictionary (20 breeds) to `be/src/config/pet-dictionary.json` as a reference source. ✓
    -   Disabled all automatic Firestore seeding (database starts empty). ✓

## Phase 3: Core Business Logic (Services)
1.  **PetsService**:
    -   `calculateIntrinsicValue(pet)`: Implement formula from PDF.
    -   `updatePetLifecycles()`: Cron job (every minute) to increment age and fluctuate health/desirability (±5%).
2.  **TradersService**:
    -   `getTrader(id)`: Fetch profile and calculate `portfolioValue`.
    -   `updateBalances(traderId, availableDelta, lockedDelta)`: Atomic updates for cash.
3.  **MarketService**:
    -   `buyFromSupply(traderId, breedId)`: Purchase logic for new pets.
    -   `listPet(traderId, petId, askingPrice)`: Create secondary market listing.
    -   `placeBid(bidderId, petId, amount)`: Validate cash, lock funds, handle outbidding.
    -   `acceptTrade(sellerId, petId)`: Transfer ownership and finalize cash movement.

## Phase 4: Real-time & API Layers
1.  **WebSocket Integration**:
    -   Broadcast pet lifecycle updates every minute.
    -   Emit private notifications for `bid_received`, `outbid`, `trade_accepted`.
2.  **REST Controllers**:
    -   `TradersController`: Get status, inventory, and history.
    -   `MarketController`: Get listings, buy from supply, bid, and list.

## Phase 5: Verification & Testing (COMPLETED)
1.  **Unit Tests**:
    -   Formula validation for intrinsic value in `be/src/pets/test/pets.service.spec.ts`. ✓
    -   Code review for bid validation logic (cash limits, owner constraints) in `MarketService`. ✓
2.  **Integration Logic**:
    -   Verified transactional safety in `placeBid` (locks cash, refunds outbid) and `acceptBid` (transfers ownership, releases cash). ✓
3.  **Manual Verification**:
    -   Verified minute-by-minute updates reflect in the database and logs via `handlePetLifecycle` cron job. ✓

## Phase 6: Frontend Integration & Mock Replacement (COMPLETED)
1.  **API URL Configuration**:
    -   Update `fe/src/environments/environment.ts` to point to the real backend URL (`http://localhost:8080/api`). ✓
    -   Set `useMockSockets: false`. ✓
2.  **Service Mapping**:
    -   Replace `ApiService`'s mock calls with real `HttpClient` requests. ✓
    -   Ensure JSON response formats match the existing FE models in `fe/src/app/models/domain.ts`. ✓
3.  **WebSocket Alignment**:
    -   Update `SocketService` to use `socket.io-client`. ✓
    -   Connect to the real `EventsGateway`. ✓
    -   Verify typed event streams (`onPetStatsUpdate`, `onNotification`, etc.) handle server-emitted events. ✓
4.  **Trader Context**:
    -   Ensure the FE correctly sends `traderId` as a query parameter for WebSocket connections to join private rooms. ✓
    -   Added backend support for fetching trader-specific notifications and portfolio components (listings, bids). ✓
