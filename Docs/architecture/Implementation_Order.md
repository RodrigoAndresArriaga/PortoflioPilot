# Implementation Order

Milestone-ordered build plan for PortfolioPilot. Each milestone has a clear entry requirement and exit criteria.

## Milestone Map

| Milestone | Scope | Maps To Overview Phase | Status |
|-----------|-------|------------------------|--------|
| **K1** | Next.js + Tailwind + shadcn + canonical docs | Phase 1 (partial) | Complete |
| **B1** | Supabase Auth + profiles table + RLS | Phase 1 | Next |
| **B2** | Portfolio input (holdings, allocation, watchlist, settings) | Phase 2 | Planned |
| **B3** | Monthly allocation engine | Phase 3 | Planned |
| **B4** | Visual dashboard (Recharts) | Phase 4 | Planned |
| **B4.5** | Market data & auto valuation (Yahoo Finance) | Phase 4 | Done |
| **B5** | Risk and technical algorithms | Phase 5 | Planned |
| **B6** | Manual ChatGPT news layer | Phase 6 | Planned |
| **B7** | Email alerts (Resend) | Phase 7 | Planned |
| **P1** | Remove target allocations; decision engine primary | Phase 3/4 refactor | Done |
| **B8+** | Later improvements (market data API, backtesting, sharing) | Phase 8 | Planned |

---

## K1 — Project Scaffold + Canonical Docs

**Scope:** Application foundation and documentation only. No product logic.

**Deliverables:**
- Next.js App Router project with TypeScript
- Tailwind CSS configured
- shadcn/ui initialized with sample component
- `docs/` canonical documentation
- `.env.example` with placeholder keys
- README with setup instructions

**Exit criteria:**
- [x] `npm run dev` starts without errors
- [x] Home page demonstrates Tailwind and shadcn/ui
- [x] All five canonical doc files exist under `docs/`
- [x] `.env.example` contains all required keys
- [x] No auth, database, dashboard, or algorithm code

**Non-goals:** onboarding, dashboard, Supabase schema migration, allocation engine, email alerts.

---

## B1 — Supabase Auth + Profiles (Next)

**Entry requirements:** K1 complete.

**Scope:**
- Supabase project setup and env wiring
- Install `@supabase/supabase-js` and SSR helpers
- Run profiles migration (see `docs/architecture/Database_Schema.md` and legacy `Docs/supabasechema.md`)
- Auth pages (`/auth`) — sign up, log in, log out
- Auto-create profile on signup via database trigger
- RLS policies on `profiles` table
- Onboarding redirect logic (`onboarding_completed` flag)

**Exit criteria:**
- User can sign up and log in
- Profile row auto-created on signup
- User can only read/write their own profile
- Unauthenticated users redirected to `/auth`
- Incomplete onboarding redirected to `/onboarding`

**Reference migration:** `Docs/supabasechema.md`

---

## B2 — Portfolio Input

**Scope:**
- Database tables: `portfolios`, `holdings`, `target_allocations`
- RLS on all new tables
- `/holdings` page — CRUD for current positions (interim: manual `current_value`; replaced by B4.5 auto valuation)
- Target allocation page — bucket weights, max percent, enabled flags
- Watchlist setup
- Settings: currency, monthly amount, investment day

**Note:** B4.5 adds Yahoo Finance quotes so users enter **symbol + shares** only; `current_value` is computed automatically.

---

## B3 — Monthly Allocation Engine

**Scope:**
- Database tables: `monthly_plans`, `monthly_plan_items`
- Target allocation algorithm (see `docs/architecture/Algorithm_Spec.md`)
- Contribution-based rebalancing
- Drift-band logic
- Exact monthly buy amount generation
- `/monthly-plan` page

---

## B4 — Visual Dashboard

**Entry requirements:** B3 stable; **B4.5 recommended** for live portfolio totals on charts.

**Scope:**
- Install Recharts
- `/dashboard` page with portfolio value cards, allocation donut chart, target vs current chart, buy plan cards, watchlist table, risk badges
- Supabase Realtime for live updates (optional in B4)

---

## B4.5 — Market Data & Auto Valuation

**Entry requirements:** B2 holdings CRUD, B3 allocation engine.

**Scope:**
- Server-side quote fetcher using **Yahoo Finance** (free, no API key) or equivalent
- Recompute `holdings.current_value` from `shares × latest_price` for ETFs and stocks
- Quote cache with TTL; refresh on page load and scheduled daily job
- Remove ongoing manual `current_value` entry — user supplies symbol + shares only
- Wire refresh into `/holdings`, `/dashboard`, `/monthly-plan`, `/settings/allocations`

**Reference:** [Market_Data.md](./Market_Data.md)

**Exit criteria:**
- Non-cash holdings auto-valued from live quotes
- Portfolio total and allocation weights update without manual price edits
- Monthly plan generation uses refreshed `current_value`
- Technical inputs derived from Yahoo price history; `computeAssetScores()` callable from server snapshot
- B5 can consume same `MarketSnapshot` without a new provider
- Stale-quote fallback when provider is unavailable
- Manual value editor removed or read-only with computed display

**Non-goals:** broker API, real-time ticks, automatic trading, paid market data APIs (B8+).

---

## B5 — Risk and Technical Algorithms

**Scope:**
- Trend score, momentum score, volatility score, drawdown score
- ETF overlap and concentration warnings
- Stock factor scoring
- Integration into monthly plan generation

---

## B6 — Manual ChatGPT News Layer

**Scope:**
- Database table: `manual_news_inputs`
- `/news-input` page for pasting structured ChatGPT report data
- ChatGPT scheduled task prompt templates (daily urgent, weekly, monthly)
- News modifier logic applied to new contribution amounts

---

## B7 — Email Alerts

**Scope:**
- Install and configure Resend
- Email templates: monthly plan ready, urgent risk warning, investment reminder, manual review required
- Server-side email dispatch on plan generation and risk events

---

## B8+ — Later Improvements

- Paid or alternate market data providers (Polygon, Alpha Vantage) behind the same quote interface
- Historical backtesting (requires price history store)
- Currency conversion for multi-currency holdings
- Family groups and view-only sharing
- OpenAI API integration (if cost-effective)

Note: **free Yahoo Finance auto-valuation** is B4.5, not B8+.

---

## Dependency Graph

```
K1 (scaffold)
  └── B1 (auth + profiles)
        └── B2 (portfolio input)
              └── P1 (decision engine primary; targets removed)
                    ├── B4.5 (market data / auto valuation)
                    ├── B4 (dashboard)
                    ├── B5 (algorithms)
                    └── B6 (news layer)
                          └── B7 (email alerts)
                                └── B8+ (improvements)
```

B4.5 should land before or alongside B4 so dashboard cards and charts show live portfolio value. B5 depends on B4.5 for price history extensions.
