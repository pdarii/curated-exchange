# Stitch Design Prompt — Pets Trading System

## App Overview

Design a **Pets Trading System** — a web application where 3 human-controlled Traders buy, sell, and manage virtual pets in a simulated marketplace. The app is built with **Angular** and **Angular Material UI** components.

## Tech Stack & Design Constraints

- **Framework:** Angular (latest)
- **UI Library:** Angular Material (use `mat-` components exclusively: `mat-card`, `mat-table`, `mat-tab-group`, `mat-toolbar`, `mat-sidenav`, `mat-chip`, `mat-badge`, `mat-dialog`, `mat-snack-bar`, `mat-icon`, `mat-button`, `mat-form-field`, `mat-select`, `mat-input`, `mat-progress-bar`, `mat-divider`, `mat-list`, `mat-menu`, `mat-expansion-panel`, `mat-tooltip`)
- **Layout:** Angular Flex Layout or CSS Grid
- **Typography & Theme:** Use Angular Material's theming system with a custom palette
- **Icons:** Material Icons

## Color Palette Suggestion

- Primary: Deep Blue (#1565C0) — trust, stability
- Accent: Amber (#FFA000) — attention for bids/trades
- Warn: Red (#D32F2F) — rejected bids, expired pets
- Success: Green (#388E3C) — accepted trades, positive changes
- Background: Light Grey (#FAFAFA) with white cards
- Each Trader panel should have a subtle color accent to distinguish them (e.g., Trader A = Blue tint, Trader B = Teal tint, Trader C = Purple tint)

## Pages & Views to Design

### 1. Main Layout (Shell)

- Top `mat-toolbar` with app title "Pets Trading System", a leaderboard toggle button, and a global clock/timer showing next valuation update countdown
- The main content area shows **3 Trader panels side-by-side** (responsive: stack vertically on smaller screens)
- Each panel is visually distinct with a subtle header color per Trader
- A shared **Market View** accessible via a `mat-tab-group` or `mat-sidenav`

### 2. Trader Panel (one per Trader — 3 total)

Each panel contains:

- **Header bar:** Trader name, avatar/icon, portfolio summary
- **Financial summary strip** (horizontal row of `mat-card` mini-cards):
  - Available Cash (with icon)
  - Locked Cash (with lock icon, `mat-badge` showing active bid count)
  - Total Portfolio Value (bold, prominent)
- **Inventory section** (`mat-tab-group` with tabs: "My Pets" | "My Bids" | "My Listings"):
  - **My Pets tab:** Grid/list of `mat-card` per pet showing: breed icon (by animal type: dog/cat/bird/fish), breed name, age, health (`mat-progress-bar`), desirability (`mat-chip`), intrinsic value, and action buttons ("List for Sale", "View Details")
  - **My Bids tab:** `mat-table` showing: pet name, bid amount, status (`mat-chip`: Active/Rejected/Outbid/Withdrawn), seller name, and "Withdraw" button
  - **My Listings tab:** `mat-table` showing: pet name, asking price, highest bid (if any), bidder name, and action buttons ("Accept Bid", "Reject Bid", "Delist")
- **Notifications section** (collapsible `mat-expansion-panel` or sidebar):
  - Chronological list of notifications using `mat-list`
  - Each item shows: icon (bid received/accepted/rejected/withdrawn/outbid), pet name, price, counterparty, timestamp
  - Unread count shown as `mat-badge` on notification toggle

### 3. Market View

- Accessible as a shared view (tab or overlay)
- **New Supply section:** Grid of `mat-card` per breed available for purchase
  - Each card shows: animal type icon, breed name, base/retail price, remaining supply count (`mat-badge`), breed stats (lifespan, desirability, maintenance), "Buy" button
  - Cards for out-of-stock breeds are greyed out / disabled
- **Secondary Market section:** `mat-table` or card grid of currently listed pets
  - Columns/fields: pet breed, seller, asking price, most recent trade price, pet age, health, intrinsic value, "Place Bid" button
  - Default sort: newest listings first
  - Optional: `mat-form-field` filters for type (dog/cat/bird/fish), price range, sort options
  - Highlight if the Trader already has an active bid on a listing

### 4. Pet Detail / Analysis View (`mat-dialog` or drill-down page)

- Opened when clicking "View Details" on any pet
- Full fundamentals display:
  - Breed name, type, and icon (large)
  - Age vs. Lifespan visual (`mat-progress-bar` showing age/lifespan ratio)
  - Health (`mat-progress-bar`, color-coded: green > 70%, yellow 40-70%, red < 40%)
  - Desirability score (star rating or numeric with `mat-chip`)
  - Maintenance cost
  - Current Intrinsic Value (large, bold)
  - Intrinsic Value Formula displayed as reference
  - Expired status indicator if age >= lifespan (red `mat-chip` "EXPIRED")
- Action: "Place Bid" or "List for Sale" depending on ownership

### 5. Leaderboard (`mat-dialog` or overlay panel)

- `mat-table` or styled cards ranking all 3 Traders by total portfolio value
- Columns: Rank, Trader name, Available Cash, Locked Cash, Pets Market Value, Total Portfolio Value
- Visual emphasis on #1 (gold highlight or trophy icon)
- Updates in real-time

### 6. Buy Pet Dialog (`mat-dialog`)

- Triggered from Market View "Buy" button
- Shows: breed info, retail price, current cash
- Quantity selector (based on supply and cash available)
- Confirm / Cancel buttons

### 7. Place Bid Dialog (`mat-dialog`)

- Triggered from Market View or Pet Detail "Place Bid"
- Shows: pet info, asking price, current highest bid (if any), Trader's available cash
- `mat-form-field` for bid amount with validation (must be > 0, must not exceed available cash)
- Confirm / Cancel buttons

### 8. List Pet for Sale Dialog (`mat-dialog`)

- Triggered from Trader Panel "List for Sale"
- Shows: pet info, current intrinsic value (as reference)
- `mat-form-field` for asking price (must be > 0)
- Confirm / Cancel buttons

## Pet Data Reference (for mock/sample data in designs)

| Type | Breed | Lifespan | Desirability | Maintenance | Base Price |
|------|-------|----------|-------------|-------------|------------|
| Dog | Labrador | 12 | 8 | 5 | $100 |
| Dog | Beagle | 13 | 7 | 4 | $90 |
| Dog | Poodle | 14 | 9 | 6 | $110 |
| Dog | Bulldog | 10 | 6 | 7 | $80 |
| Dog | Pit Bull | 11 | 5 | 5 | $70 |
| Cat | Siamese | 15 | 9 | 4 | $90 |
| Cat | Persian | 14 | 8 | 6 | $85 |
| Cat | Maine Coon | 16 | 7 | 5 | $80 |
| Cat | Bengal | 12 | 6 | 5 | $75 |
| Cat | Sphynx | 13 | 5 | 7 | $70 |
| Bird | Parakeet | 8 | 7 | 3 | $25 |
| Bird | Canary | 10 | 6 | 2 | $20 |
| Bird | Cockatiel | 12 | 8 | 3 | $30 |
| Bird | Macaw | 50 | 9 | 8 | $120 |
| Bird | Lovebird | 15 | 5 | 3 | $15 |
| Fish | Goldfish | 10 | 5 | 2 | $5 |
| Fish | Betta | 5 | 6 | 1 | $6 |
| Fish | Guppy | 3 | 4 | 1 | $4 |
| Fish | Angelfish | 8 | 7 | 2 | $8 |
| Fish | Clownfish | 6 | 8 | 3 | $10 |

## Intrinsic Value Formula

`Intrinsic Value = Base Price x (Health / 100) x (Desirability / 10) x max(0, 1 - Age / Lifespan)`

- Health: 0-100%, fluctuates +/-5% per minute
- Age: starts at 0, increases continuously
- Expired pets (age >= lifespan): intrinsic value = 0, but can still be traded at market-driven price

## Key UX Requirements

1. **Real-time feel:** Valuation updates every minute should animate smoothly (color transitions, value counters)
2. **Trader isolation:** Each Trader can only see their own cash, bids, and inventory — not other Traders' private data
3. **Visual bid status:** Use color-coded `mat-chip` for bid states: Active (blue), Accepted (green), Rejected (red), Withdrawn (grey), Outbid (amber)
4. **Health visualization:** `mat-progress-bar` with color thresholds (green/yellow/red)
5. **Notifications:** `mat-snack-bar` for real-time alerts + persistent notification list in panel
6. **Expired pets:** Visual indicator (red overlay, "EXPIRED" badge) — but still tradeable
7. **Responsive:** 3-panel layout on desktop, tabbed/stacked on mobile
8. **Accessibility:** Follow Angular Material's built-in a11y patterns, proper ARIA labels
9. **Confirmation dialogs:** For critical actions (accept/reject bid, delist pet, withdraw bid)
10. **Empty states:** Design empty state messages for: no pets in inventory, no active bids, no listings, no notifications

## Sample Scenario for Design Mockups

Use this scenario to populate the designs with realistic data:

- **Trader A:** Has 3 pets (Labrador age 2.1, Poodle age 0.5, Goldfish age 1.3), $450 available cash, $55 locked (1 active bid), has listed the Poodle for $120
- **Trader B:** Has 2 pets (Siamese age 1.8, Macaw age 3.2), $320 available cash, $0 locked, has placed a bid of $55 on Trader A's Poodle
- **Trader C:** Has 4 pets (Beagle age 0.3, Bengal age 4.1, Parakeet age 2.0, Betta age 1.5), $280 available cash, $90 locked (2 active bids)
- **Market:** 2 pets listed (Trader A's Poodle at $120, Trader C's Bengal at $85), supply remaining for most breeds
