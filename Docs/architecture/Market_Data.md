# Market Data & Auto Valuation

PortfolioPilot must keep holdings valued from **live market prices**, not user-entered guesses. Manual `current_value` entry is an interim B2 workaround; automatic valuation is a required product behavior.

---

## Product Rule

1. **User enters:** symbol, shares (or units), cost basis, asset type, broker, currency.
2. **System fetches:** latest market price per symbol from a free quote provider.
3. **System computes:** `current_value = shares × latest_price` (converted to portfolio base currency when needed).
4. **User never maintains** `current_value` by hand on an ongoing basis.

Cash and non-market assets (brokerage cash, money market) stay user-defined or fixed at par.

---

## Primary Provider (v1)

**Yahoo Finance** (free, no API key) via a server-side quote fetcher.

Implementation options (pick one in code):

- Unofficial Yahoo chart/quote endpoints (server-only; no browser calls)
- A thin wrapper library that reads Yahoo quotes server-side

Requirements:

- Server-side only (Next.js server actions / route handlers / cron). Do not call Yahoo from the browser.
- Cache quotes (see below) to respect rate limits and keep pages fast.
- Graceful fallback: show last cached price + stale badge if fetch fails; do not block the app.

Future (B8+): optional paid provider (Polygon, Alpha Vantage, etc.) behind the same interface.

---

## Quote Service Boundary

```
lib/server/market-data/
  quote-provider.ts      # interface
  yahoo-quote-provider.ts
  refresh-holdings.ts    # recompute all holdings for a user/portfolio
```

Public server API (planned):

| Function | Purpose |
|----------|---------|
| `getQuote(symbol)` | Latest price + currency + as-of timestamp |
| `refreshPortfolioValuations(userId)` | Update all non-cash holdings |
| `refreshHoldingValuation(holdingId)` | Single-symbol refresh |

All consumers use **stored** `holdings.current_value` after refresh — they do not call Yahoo directly.

---

## Refresh Strategy

| Trigger | When |
|---------|------|
| **On load** | `/holdings`, `/dashboard`, `/monthly-plan`, `/settings/allocations` if cache older than TTL |
| **Scheduled** | Daily job after US market close (and optional pre-open refresh) |
| **On demand** | "Refresh prices" control on holdings/dashboard (optional UX) |
| **After CRUD** | User adds/edits holding symbol or shares → fetch quote for that symbol |

Suggested cache TTL: **15 minutes** during market hours, **24 hours** after close (tunable).

---

## Pages & Features That Depend on Live Prices

These must show auto-updated values — never require manual price entry in steady state:

| Surface | Uses price for |
|---------|----------------|
| `/holdings` | Position value, portfolio total, allocation weights |
| `/dashboard` | Portfolio value card, allocation donut, drift, buy plan context |
| `/monthly-plan` | E1 engine input (`current_value` per symbol) |
| `/settings/allocations` | Current vs target weight display |
| `/onboarding` (holdings step) | Initial portfolio snapshot after symbol + shares |
| **P&L / profits** (future) | Gain/loss vs `cost_basis`, return % |
| **B5 technical scores** (future) | Price history, moving averages, momentum |
| **Watchlist** (future signals) | Last price, daily change |

---

## Schema Notes (planned migration)

Extend `holdings` (or add `holding_quotes` cache table):

| Column | Purpose |
|--------|---------|
| `last_price` | Fetched quote in holding currency |
| `last_price_at` | Quote timestamp |
| `price_source` | e.g. `yahoo` |
| `current_value` | Denormalized `shares × last_price` (still the weight input for the engine) |

`cost_basis` remains user-entered (or imported) for P&L; it is not fetched from Yahoo.

---

## UX Guidelines

- Holdings form: **symbol + shares** required for market assets; hide or read-only **current value** (show computed value + "as of" time).
- Show **stale price warning** if `last_price_at` exceeds TTL.
- Copy must distinguish **manual trading** (user places orders) from **automatic pricing** (system updates valuations).

---

## Non-Goals

- Real-time streaming quotes (WebSocket tick data)
- Intraday trading or sub-minute refresh
- Crypto exchange APIs in v1 (manual or fixed value until B8+)
- Automatic order execution

---

## Milestone

See **B4.5 — Market Data & Auto Valuation** in [Implementation_Order.md](./Implementation_Order.md).

Exit criteria:

- [ ] Yahoo (or equivalent free) quote fetcher runs server-side
- [ ] `current_value` recomputed from shares × price for all non-cash holdings
- [ ] Holdings, dashboard, and monthly plan reflect refreshed values without manual edits
- [ ] Scheduled + on-load refresh with caching
- [ ] Manual `current_value` editor removed or read-only
