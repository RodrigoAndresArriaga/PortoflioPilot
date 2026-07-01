# Market Data & Auto Valuation

PortfolioPilot keeps holdings valued from **server-fetched market prices**, not user-entered guesses. Manual `current_value` entry is only for cash and non-quoted assets.

---

## Product Rule

1. **User enters:** symbol, shares (or units), cost basis, asset type, broker, currency.
2. **System fetches:** latest market price per symbol from Yahoo Finance (server-side).
3. **System computes:** `current_value = shares × latest_price` (in holding currency).
4. **User never maintains** `current_value` by hand for ETFs and stocks.

Cash and non-market assets (brokerage cash, crypto in v1) stay user-defined.

**“Realtime” in B4.5** means fresh quotes on each refresh cycle (15-minute TTL cache), not WebSocket tick streams.

---

## Architecture

```
Yahoo chart API (2y daily + latest price)
  → symbol_market_cache (shared per symbol)
  → refreshHoldingsValuations
  → holdings.last_price / current_value
  → indicators → buildTechnicalInputs → computeAssetScores
```

Pages and engines never call Yahoo directly. They use `getPortfolioMarketSnapshot()` / `getHoldingsWithFreshPrices()`.

---

## Module Layout

| Path | Role |
|------|------|
| `lib/server/market-data/yahoo-provider.ts` | Yahoo chart API fetch |
| `lib/server/market-data/cache.ts` | `symbol_market_cache` read/write, TTL |
| `lib/server/market-data/refresh-holdings.ts` | Recompute holding values |
| `lib/server/market-data/refresh-portfolio-market.ts` | Orchestrator + technical scores |
| `lib/market-data/indicators.ts` | Pure indicator math |
| `lib/market-data/build-technical-inputs.ts` | Price history → engine inputs |
| `lib/market-data/build-asset-scores.ts` | Live inputs → `computeAssetScores()` |

Public server API:

| Function | Purpose |
|----------|---------|
| `getOrFetchHistory(symbol)` | Cached 2y daily bars + latest quote |
| `refreshPortfolioMarket(holdings)` | Refresh quotes, revalue holdings, build scores |
| `getPortfolioMarketSnapshot()` | Authenticated refresh + `MarketSnapshot` |
| `getHoldingsWithFreshPrices()` | Holdings after stale refresh |
| `getTechnicalScoresForSymbols(symbols[])` | B5 hook for score-only access |
| `refreshPortfolioPrices()` | Server action for manual refresh button |

---

## Technical Score Data Flow

1. Fetch ~2 years of daily closes from Yahoo (`range=2y&interval=1d`).
2. Compute indicators (see mapping below).
3. Map to `MomentumInputs`, `TrendInputs`, `VolatilityInputs` in `lib/engine/scores.ts`.
4. Call existing `computeAssetScores()` in `lib/engine/final-score.ts`.
5. Stock quality/value/growth factors default to **50** until B5 fundamentals.
6. B5 will consume the same `MarketSnapshot` for position sizing — not wired in B4.5.

### Indicator mapping (Algorithm Spec §6–8)

| Engine input | Source |
|--------------|--------|
| `return_3m/6m/12m` | Percent return over ~63/126/252 trading days → 0–100 score |
| `price_above_200dma` | Latest close vs SMA-200 |
| `price_above_50dma` | Latest close vs SMA-50 |
| `ma50_above_200dma` | SMA-50 vs SMA-200 |
| `volatility_90d` | 90d annualized vol → inverted safety score |
| `max_drawdown_1y` | Peak-to-trough over last ~252 sessions |
| `beta` | vs SPY benchmark history |
| `downside_volatility` | Downside deviation over 90d |

---

## Refresh Strategy

| Trigger | When |
|---------|------|
| **On load** | `/holdings`, `/dashboard`, `/monthly-plan`, `/settings/allocations` if cache older than TTL |
| **Scheduled** | `GET /api/cron/refresh-market-data` daily after US close (`Authorization: Bearer $CRON_SECRET`) |
| **On demand** | “Refresh prices” on `/holdings` |
| **After CRUD** | User adds/edits symbol or shares → single-holding refresh |

Cache TTL: **15 minutes** quotes, **24 hours** history.

---

## Schema (`005_market_data.sql`)

**`holdings` extensions:**

| Column | Purpose |
|--------|---------|
| `last_price` | Fetched quote in holding currency |
| `last_price_at` | Quote timestamp |
| `price_source` | e.g. `yahoo` |
| `current_value` | Denormalized `shares × last_price` (engine weight input) |

**`symbol_market_cache` (shared, not per user):**

| Column | Purpose |
|--------|---------|
| `symbol` | Primary key |
| `latest_price`, `currency`, `quoted_at` | Latest quote |
| `history_json` | ~2y daily OHLCV bars (close only in v1) |
| `history_fetched_at` | History cache timestamp |

RLS: authenticated read; upsert via server/cron (service role for batch jobs).

---

## Pages & Features That Depend on Live Prices

| Surface | Uses price for |
|---------|----------------|
| `/holdings` | Position value, portfolio total, stale badge |
| `/dashboard` | Portfolio value card, allocation donut, drift |
| `/monthly-plan` | E1 engine input (`current_value` per symbol) |
| `/settings/allocations` | Current vs target weight display |
| `/onboarding` (holdings step) | Symbol + shares → quote on complete |
| **B5 position sizing** (future) | Technical scores from same snapshot |

---

## UX Guidelines

- Holdings form: **symbol + shares** for ETF/stock; read-only computed value + “as of” time.
- Show **stale price warning** if `last_price_at` exceeds 15-minute TTL.
- Distinguish **manual trading** (user places orders) from **automatic pricing** (system updates valuations).

---

## Non-Goals (B4.5)

- WebSocket / sub-minute tick data
- Stock fundamental factors from Yahoo (neutral 50 until B5)
- Applying technical scores to monthly buy amounts (B5)
- Paid quote providers (B8+)
- Crypto exchange APIs

---

## Milestone Exit Criteria

- [x] Yahoo provider fetches latest price + 2y daily history server-side
- [x] Holdings `current_value` auto-computed; manual price editor removed for etf/stock
- [x] Listed pages refresh stale quotes on load
- [x] Technical engine receives price-derived momentum/trend/volatility inputs
- [x] `getPortfolioMarketSnapshot()` returns holdings + technical scores from same refresh
- [x] Stale/failure fallback uses last cached quote with UI badge
- [x] Tests cover indicators + market-to-scores pipeline

See **B4.5** in [Implementation_Order.md](./Implementation_Order.md).
