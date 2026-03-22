---
name: Playwright test setup and file layout
description: How tests are organized, configured, and the session injection pattern
type: project
---

## Config file
`/Users/pdarii/work/hackathon/fe/playwright.config.ts`
- `testDir: './tests'`
- `baseURL: 'http://localhost:4200'`
- `webServer`: runs `npm start`, reuses existing server locally
- Projects: chromium, firefox, webkit
- Screenshots on failure

## Test files
```
tests/
  helpers/
    auth.helper.ts          # loginAs() UI helper, setSession() fast-inject, USERS constant
  page-objects/
    LoginPage.ts
    DashboardPage.ts
    MarketPage.ts
    AssetsPage.ts
    CatalogPage.ts
  auth.e2e-spec.ts          # Auth, guards, logout (~20 tests)
  navigation.e2e-spec.ts    # Header nav, active links, admin nav (~12 tests)
  dashboard.e2e-spec.ts     # Financial strip, pets, ops, sidebar, notifications, dialogs (~25 tests)
  market.e2e-spec.ts        # P2P table, filters, sort, pagination, dialogs (~25 tests)
  assets.e2e-spec.ts        # Assets list, search, detail, trade history (~25 tests)
  catalog.e2e-spec.ts       # Breed cards, filters, pagination, buy dialog (~22 tests)
  dialogs.e2e-spec.ts       # All 4 dialogs from each entry point (~30 tests)
  admin.e2e-spec.ts         # Admin dashboard + settings (~20 tests)
  notifications.e2e-spec.ts # Bell, popup, badge, click-to-dialog (~12 tests)
  trader-isolation.e2e-spec.ts # Per-trader data isolation (~10 tests)
```

## Session injection pattern
To avoid repeating UI login in every test, inject sessionStorage directly:
```ts
await setSession(page, USERS.alice);  // navigates to /login, sets sessionStorage
await page.goto('/dashboard');         // then navigate to the target page
```

`USERS` object contains the same shape as `MOCK_TRADERS` in auth.service.ts.

## API delay
The mock API uses a 300ms `delay()` operator. Tests use `waitFor({ state: 'visible' })`
on key elements rather than `page.waitForTimeout()` to handle this reliably.

**Why:** Needed at the start of every conversation to understand how tests are laid out.
**How to apply:** When adding new tests, follow the existing file structure and use `setSession`.
