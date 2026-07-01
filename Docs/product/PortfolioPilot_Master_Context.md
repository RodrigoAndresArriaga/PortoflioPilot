# PortfolioPilot Master Context

## Product Definition

PortfolioPilot is a **multi-user, manual-only long-term investment dashboard** built with Next.js, Supabase, shadcn/ui, and Tailwind CSS. It uses monthly contribution planning, current holdings, target allocation, technical/risk algorithms, and manually entered ChatGPT daily-urgent, weekly, and monthly news-risk reports to generate exact monthly buy amounts with clear visual dashboards and email alerts.

The app does **not** trade automatically. The final output is a clear monthly buy plan the user executes manually in their brokerage account.

Example output:

```
July 2026 Monthly Plan
Invest:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Brokerage cash: 500 MXN
```

## Strategy Framing

The system combines:

- Long-term investing
- Monthly contribution planning
- Portfolio allocation control
- Risk-aware rebalancing
- News-response layer for major events
- Manual execution

It is **not** scalping, day trading, automatic trading, AI headline trading, high-frequency trading, or broker-connected trading bots.

## Core Product Rules

1. Manual trading only.
2. No automatic broker execution.
3. No broker API integration in v1.
4. ChatGPT does not directly decide trades.
5. AI news analysis only modifies risk/new-contribution behavior.
6. Broad ETFs are prioritized over individual stocks.
7. Individual stock exposure is capped.
8. News affects new buys first, not existing holdings.
9. Broad ETFs should not be sold because of one short-term headline.
10. If news confidence is low, reduce or ignore the news effect.
11. Unused growth allocation moves to cash or underweight core ETF.
12. Selling requires manual emergency review.
13. Every user's data is private and protected with Supabase RLS.

## Multi-User Model

- Auth via Supabase (email + password; Google login optional later).
- v1: one user = one private account = one portfolio.
- Each user owns their own profile, currency, monthly amount, risk profile, time horizon, portfolio, holdings, target allocation, watchlist, monthly plans, and news-risk inputs.
- Friends and family can use the app; data must remain private and separate.

## Onboarding Flow (Future — Not K1)

1. **Account** — sign up or log in.
2. **Currency and monthly amount** — preferred currency, monthly investment amount, investment day (default: 1st).
3. **Investor profile** — risk profile (conservative / balanced / growth / aggressive growth), time horizon.
4. **Current holdings** — ticker, asset type, currency, current value, cost basis, optional shares and broker.
5. **Target allocation** — recommended or custom bucket weights (core ETF, growth, individual stocks, cash).
6. **Watchlist** — curated ETF and stock symbols for monitoring.
7. **First monthly plan preview** — generated buy plan for user confirmation.

## Monthly Investment Timing

- Invest on the **1st of every month**.
- If the 1st is not a trading day, invest on the next trading day.
- The monthly plan should be generated before the 1st.

## ChatGPT Workflow

ChatGPT is a **manual scheduled research/news analyst**, not an execution engine. The subscription cannot be used programmatically inside the app.

```
ChatGPT Scheduled Task produces structured market/news report
        ↓
User copies structured output
        ↓
User manually enters values into frontend
        ↓
Frontend combines those values with technical/risk algorithms
        ↓
App generates exact monthly buy amounts
        ↓
User manually trades
```

## Report Cadence

Three research/report layers:

1. **Daily urgent-news scan** — only when news is urgent or materially relevant (market crash, Fed shock, earnings collapse, regulation risk, etc.). If nothing urgent, return a no-action JSON payload.
2. **Weekly market review** — summarize the week, identify market regime, detect trend changes, flag assets requiring attention.
3. **Monthly allocation review** — broader allocation and risk review before the monthly buy plan.

## Core Frontend Pages (Future Reference)

| Route | Purpose |
|-------|---------|
| `/auth` | Sign up and log in |
| `/onboarding` | Multi-step setup flow |
| `/dashboard` | Portfolio overview, allocation charts, buy plan, risk badges |
| `/holdings` | Add and edit current positions |
| `/monthly-plan` | Exact monthly buy amounts |
| `/news-input` | Enter ChatGPT scheduled report values |
| `/settings` | Monthly amount, currency, risk profile, allocation, email prefs, watchlist |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js App Router, shadcn/ui, Tailwind CSS |
| Hosting | Vercel |
| Backend | Next.js API routes / server actions |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Email | Resend (or similar) |
| Charts | Recharts (later) |
| Validation | Zod (later) |
| Trading | Manual only |

## MVP Build Phases

1. **Multi-user foundation** — Next.js, shadcn, Tailwind, Supabase Auth, profiles, RLS, onboarding.
2. **Portfolio input** — holdings, target allocation, watchlist, currency, monthly amount.
3. **Monthly allocation engine** — target allocation algorithm, contribution-based rebalancing, drift bands, exact buy amounts.
4. **Visual dashboard** — portfolio cards, allocation charts, buy plan cards, watchlist table, risk badges.
5. **Risk and technical algorithms** — trend, momentum, volatility, drawdown, concentration warnings.
6. **Manual ChatGPT news layer** — scheduled task prompts, daily/weekly/monthly input, news modifier logic.
7. **Email alerts** — monthly plan, urgent risk, investment reminder, manual review.
8. **Later improvements** — API market data, auto price updates, backtesting, currency conversion, family groups, view-only sharing.

## Email Alerts (Future)

Alerts include: monthly buy plan ready, risk level changed, urgent-news alert, weekly risk summary, monthly investment reminder, portfolio concentration warning, manual review required.

## Default Allocation Model (Original User)

Monthly income bucket for stocks/ETFs: 4,000 MXN split as:

| Bucket | % | Monthly MXN |
|--------|---|-------------|
| Broad U.S. / global market ETF | 70% | 2,800 |
| Higher-risk growth/tech | 20% | 800 |
| Cash reserve inside brokerage | 10% | 400 |

Other users can customize monthly amount, currency, holdings, and allocation.
