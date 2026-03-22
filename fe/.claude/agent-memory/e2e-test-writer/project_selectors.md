---
name: CSS selectors for key UI elements
description: Verified DOM selectors for all pages and dialogs in the Pets Trading System
type: project
---

## Shell / Layout
- `.shell-header` — trader shell header wrapper
- `.shell-nav a` — nav links (Dashboard, Market, Assets)
- `.shell-nav__link--active` — active nav link class
- `.shell-logo` — brand logo link
- `.notif-anchor button[mat-icon-button]` — notification bell
- `.feed-popup` — activity feed popup panel
- `.feed-popup__title` — popup title
- `.feed-popup .feed-item` — individual notification items
- `.feed-item--unread` — unread item modifier
- `.feed-item--clickable` — bid_received items that open AcceptBidDialog
- `.feed-popup__close` — close button inside popup
- `.feed-backdrop` — click-outside backdrop
- `button[mat-icon-button] mat-icon:text("account_balance_wallet")` — logout button
- `.admin-header` — admin shell header
- `.admin-nav a` — admin nav links
- `.admin-logo` — admin brand logo

## Login
- `input[name="username"]` — username field
- `input[name="password"]` — password field
- `button[type="submit"]` — sign in button
- `.text-error` — error message paragraph

## Dashboard
- `.fin-strip` — financial summary strip
- `.fin-card` — individual financial card
- `.fin-card__label` — label text inside card
- `.fin-card__value` — value text inside card
- `.pet-card` — pet inventory cards (inside `.pet-grid`)
- `.pet-card__name` — breed name inside card
- `.pet-card__stats` — age/health stats row
- `.badge--primary` — "Active Listing" badge on card
- `.dash-section__title` — section heading (includes trader name)
- `.ops-table` — active market operations table
- `.ops-row:not(.ops-row--header)` — data rows
- `.ops-cell--type` — type column
- `.badge--primary-sm` — "1 Bid Received" badge (click to open AcceptBidDialog)
- `.sidebar-feed` — global market feed
- `.btn-new-listing` — "New Listing" button in sidebar
- `.sentiment__label` — market sentiment label

## Market
- `.mkt-header__title` — "Global Market" heading
- `.mkt-type-filters .type-pill` — type filter pills
- `.type-pill--active` — active filter pill
- `.p2p-table` — P2P listings table
- `.p2p-row:not(.p2p-row--header)` — data rows
- `.p2p-cell--breed`, `--seller`, `--asking`, `--intrinsic`, `--health`, `--age` — cells
- `.action-btn--blue` — Place Bid button
- `.action-btn--amber` — Update Bid button
- `.own-badge` — "Your Active Bid" badge
- `.sort-inline__field mat-select` — sort dropdown
- `.btn-create-listing` — Create Listing button
- `.mkt-pagination` — pagination container
- `.mkt-pagination__page` — page number buttons
- `.mkt-pagination__page--active` — active page
- `.mkt-pagination__arrow` — prev/next arrows
- `.p2p-empty` — empty state
- `.retail-card` — retail supply cards
- `.retail-card__name`, `.retail-card__price` — card details
- `.retail-card__buy` — Buy button on retail card

## Assets
- `.assets-header__title` — "Portfolio Assets" heading
- `.assets-header__subtitle` — trader name subtitle
- `.stat-card` — stat cards (Total Assets, Avg Health, Liquidity)
- `.filters-bar__search input` — search input
- `.filters-bar__select mat-select` — type and sort selects
- `.assets-row:not(.assets-row--header)` — data rows
- `.assets-cell--breed`, `--type`, `--age`, `--value`, `--status` — cells
- `.status-badge--listed` — "Active Listing" badge
- `.status-badge--bid` — "On Bid" badge
- `.status-badge--inventory` — "In Inventory" badge
- `.assets-empty` — empty state
- `.assets-pagination__info` — pagination info text

## Asset Detail
- `.breadcrumb__link` — breadcrumb back link
- `.detail-header` — pet identity header wrapper
- `.detail-header__name` — pet name
- `.detail-header__breed` — breed label
- `.valuation-card` — current valuation card
- `.valuation-card__amount` — dollar amount
- `.stats-row` — stats cards row
- `.stats-card` — individual stat card
- `.formula-section` — intrinsic value formula section
- `.formula-section__title`
- `.formula-chip--total` — total chip in formula
- `.formula-op` — × and = operators
- `.btn-action--primary` — "List for Sale" button
- `.btn-action--outline` — "View Trade History" button

## Trade History
- `.th-header__title`
- `.th-stat-card` — Total Trades, Peak Valuation, Days in Portfolio
- `.ledger__title` — "Event Ledger"
- `.ledger__filter` — filter button
- `.ledger-row--header` — header row
- `.ledger-row:not(.ledger-row--header)` — data rows

## Catalog
- `.cat-header__title` — "Retail Catalog" heading
- `.cat-filters__pills .type-pill` — filter pills
- `.cat-filters__sort` — sort trigger
- `.cat-card` — breed cards in grid
- `.cat-card__name`, `.cat-card__price`, `.cat-card__buy` — card elements
- `.supply-badge` — supply level badge
- `.cat-card__lifespan-bar` — lifespan bar
- `.cat-footer__info` — items per page text
- `.cat-pagination` — pagination
- `.cat-pagination__page`, `.cat-pagination__page--active`
- `.cat-pagination__arrow` — prev/next
- `.cat-empty` — empty state

## Dialogs (all render inside `mat-dialog-container`)
### List for Sale
- `h2` — "List Pet for Sale"
- `mat-select` — pet selector
- `input[type="number"]` — asking price input
- `.intrinsic-display` — shows after pet selection
- `.intrinsic-display__value` — dollar amount
- `.dialog-confirm` — Confirm Listing button (disabled until pet+price valid)
- `.dialog-cancel` — Cancel button

### Place Bid
- `h2` — "Place a Bid" or "Update Bid"
- `.bid-item__name` — breed name
- `.bid-item__seller` — seller info
- `.bid-price-card--asking` — asking price card
- `.bid-cash` — available cash row
- `.bid-input-wrap__input` — bid amount input
- `.bid-confirm` — Confirm Bid button
- `.bid-cancel` — Cancel button
- `.bid-error` — insufficient funds message
- `.bid-warn` — bid too low message

### Purchase Pet
- `.purchase-title` — "Purchase Pet"
- `.pet-info-card__name` — breed name
- `.pet-info-card__price` — price per pet
- `.qty-control` — quantity stepper wrapper
- `.qty-btn` — + / - buttons
- `.qty-value` — current quantity
- `.total-row__value` — total cost
- `.cash-row` — available cash row
- `.purchase-confirm` — Confirm Purchase button
- `.purchase-cancel` — Cancel button
- `.purchase-close` — X close button

### Accept Bid
- `.abd-title` — "Accept Trade Bid"
- `.abd-pet__name`, `.abd-pet__breed`, `.abd-pet__stats`
- `.abd-bid-card` — highest bid card
- `.abd-bid-card__amount`
- `.abd-breakdown__row` — Intrinsic Value / Market Premium rows
- `.abd-gain__label`, `.abd-gain__return-value`
- `.abd-toggle` — "View Other Offers" toggle
- `.abd-offers` — collapsible offers list
- `.abd-btn--accept` — "Accept & Complete Sale"
- `.abd-btn--reject` — "Cancel & Keep"
- `.abd-disclaimer`
- `.abd-header button[mat-icon-button]` — close icon

## Admin
- `.adm-header__title` — "Market Overview"
- `.adm-stat` — stat cards
- `.adm-bar` — chart bars (7 total)
- `.adm-feed-item` — activity feed items
- `.adm-feed-btn` — "View All Activity Logs"
- `.set-header__title` — "Platform Settings"
- `.sim-param__label`, `.sim-param__value`
- `mat-slider` — time dilation slider
- `.sim-gauge__label`
- `.inv-row--header`, `.inv-row:not(.inv-row--header)` — inventory table
- `.set-card__action` — "Download .CSV"
- `.inject-item`, `.inject-btn`
- `.bulk-inject-btn`

**Why:** Selectors are derived from actual template files — authoritative source of truth.
**How to apply:** Use these when writing new tests; verify against template files if behavior changes.
