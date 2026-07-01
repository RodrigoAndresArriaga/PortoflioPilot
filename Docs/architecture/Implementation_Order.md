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
| **B5** | Risk and technical algorithms | Phase 5 | Planned |
| **B6** | Manual ChatGPT news layer | Phase 6 | Planned |
| **B7** | Email alerts (Resend) | Phase 7 | Planned |
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
- `/holdings` page — CRUD for current positions
- Target allocation page — bucket weights, max percent, enabled flags
- Watchlist setup
- Settings: currency, monthly amount, investment day

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

**Scope:**
- Install Recharts
- `/dashboard` page with portfolio value cards, allocation donut chart, target vs current chart, buy plan cards, watchlist table, risk badges
- Supabase Realtime for live updates (optional in B4)

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

- API-based market data and automatic price updates
- Historical backtesting
- Currency conversion
- Family groups and view-only sharing
- OpenAI API integration (if cost-effective)

---

## Dependency Graph

```
K1 (scaffold)
  └── B1 (auth + profiles)
        └── B2 (portfolio input)
              └── B3 (allocation engine)
                    ├── B4 (dashboard)
                    ├── B5 (algorithms)
                    └── B6 (news layer)
                          └── B7 (email alerts)
                                └── B8+ (improvements)
```

B4, B5, and B6 can partially overlap after B3 is stable, but B3 must land first because the dashboard and algorithms depend on plan generation output.
