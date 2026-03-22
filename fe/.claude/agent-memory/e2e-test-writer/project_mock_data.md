---
name: Mock data for traders
description: Pets, listings, bids, and cash values for each trader in the mock backend
type: project
---

## Trader portfolios (from api.service.ts / mock-data.ts)
| Trader  | Cash  | Locked | Pets                          | Own Listings         |
|---------|-------|--------|-------------------------------|----------------------|
| alice   | $450  | $45    | pet-a1 Labrador, pet-a2 Poodle, pet-a3 Goldfish | listing-1 (Poodle $120) |
| bob     | $320  | $0     | pet-b1 Siamese, pet-b2 Macaw  | none                 |
| charlie | $280  | $45    | pet-c1 Beagle, pet-c2 Bengal, pet-c3 Parakeet, pet-c4 Betta | listing-2 (Bengal $85) |

## Active bids
- bid-1: bob → listing-1 (Poodle), $55, status=active
- bid-2: alice → listing-2 (Bengal), $45, status=active
- bid-3: bob → listing-2 (Bengal), $40, status=outbid

## Notifications
- notif-1, notif-6: trader-a, bid_received (Poodle bid from Bob) — unread
- notif-4, notif-7: trader-a, bid_accepted + bid_outbid — read
- notif-2: trader-b, bid_outbid (Bengal) — unread
- notif-3: trader-c, bid_received (Bengal) — read

## Catalog
20 breeds total; 8 per page (3 pages). Featured retail: Labrador, Siamese, Beagle, Poodle.

**Why:** Needed to write precise assertions (exact counts, dollar values, which badges appear).
**How to apply:** Use these values when asserting specific counts and cash amounts in tests.
