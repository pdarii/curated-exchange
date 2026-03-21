# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pets Trading System** — a hackathon project demonstrating AI-assisted system development. Three human-controlled Traders buy, sell, and manage virtual pets in a simulated marketplace. Full requirements are in `documentation/ANH-Pets Trading System-200326-181106.pdf` and the UI design spec is in `documentation/stitch-design-prompt.md`.

## Repository Structure

- `fe/` — Angular 21 frontend (the main application)
- `be/` — Backend (empty, not yet implemented)
- `documentation/` — Requirements PDF and Stitch design prompt

## Development Commands

All commands run from the `fe/` directory:

```bash
cd fe
npm start        # Dev server at http://localhost:4200
npm run build    # Production build → dist/
npm test         # Unit tests (Vitest via Angular CLI)
ng generate component component-name  # Scaffold new component
```

## Tech Stack

- **Angular 21** with standalone components (no NgModules — use `imports` array in `@Component`)
- **Angular Material** (M3 theming) — use `mat-` components exclusively
- **Tailwind CSS 4** via PostCSS
- **SCSS** for component styles
- **Vitest** for unit testing
- **TypeScript 5.9** with strict mode enabled (`strict`, `strictTemplates`, `strictInjectionParameters`)
- **Prettier** configured in package.json: 100 char width, single quotes, angular HTML parser

## Architecture Notes

- App bootstraps via `bootstrapApplication()` (standalone, no AppModule)
- Routing configured in `fe/src/app/app.routes.ts` (currently empty)
- Global theme in `fe/src/styles.scss` — Material M3 with blue primary / violet tertiary palette
- Component prefix: `app`

## Domain Rules

- **3 Traders** with isolated panels (cannot see each other's private data)
- **20 pet breeds** across 4 types (Dog/Cat/Bird/Fish), read-only dictionary
- **Intrinsic Value** = `BasePrice × (Health/100) × (Desirability/10) × max(0, 1 - Age/Lifespan)`
- Health fluctuates ±5% per minute; age increases continuously
- Expired pets (age >= lifespan) have intrinsic value 0 but remain tradeable
- **Cash locking**: active bids lock cash; released on withdrawal/rejection/outbid
- **One active listing per pet**; only highest bid is active per listing
- Bids can be above or below asking price; traders cannot bid on own pets
- Portfolio Value = available cash + locked cash + market value of pets
