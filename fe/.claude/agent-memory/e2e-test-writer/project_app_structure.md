---
name: App structure and routing
description: Routes, guards, layouts, and key component selectors for the Pets Trading System
type: project
---

## Routes
- `/login` — Login component (selector: `app-login`)
- `/dashboard` — Trader dashboard (shell layout), requires authGuard + traderGuard
- `/market` — Global market P2P + retail supply
- `/assets` — Portfolio asset list
- `/assets/:id` — Asset detail
- `/assets/:id/history` — Trade history ledger
- `/catalog` — Retail breed catalog
- `/admin` — Admin dashboard (admin-shell layout), requires authGuard + adminGuard
- `/admin/settings` — Platform settings

## Guards
- `authGuard` — redirects unauthenticated to `/login`
- `traderGuard` — redirects admin to `/admin`, passes traders through
- `adminGuard` — redirects non-admin to `/dashboard`

## Shell layouts
- `app-shell` (`.shell-header`) — trader layout with nav: Dashboard, Market, Assets
- `app-admin-shell` (`.admin-header`, `.admin-nav`) — admin layout with nav: Dashboard, Settings

## Mock users (sessionStorage key: `currentUser`)
| username | id        | name    | role   | redirect  |
|----------|-----------|---------|--------|-----------|
| alice    | trader-a  | Alice   | trader | /dashboard|
| bob      | trader-b  | Bob     | trader | /dashboard|
| charlie  | trader-c  | Charlie | trader | /dashboard|
| admin    | admin     | Admin   | admin  | /admin    |

**Why:** Need this every time writing auth tests or guard tests.
**How to apply:** Use `setSession(page, USERS.xxx)` helper to bypass the UI login for non-auth tests.
