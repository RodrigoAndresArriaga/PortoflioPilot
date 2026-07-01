# Database Schema

Full table catalog for PortfolioPilot. **P1 (migration 008)** removed hard target allocation tables (`target_allocations`, `target_buckets`, `target_assets`). Monthly plans now store recommendation scores instead of target/current weights.

---

## Entity Relationships

```
auth.users
  └── profiles (1:1)
  └── portfolios (1:many, v1: 1:1 via unique user_id)
        ├── holdings (1:many)
        └── monthly_plans (1:many)
              └── monthly_plan_items (1:many)
  └── watchlist_items (1:many)
  └── manual_news_inputs (1:many)
```

---

## profiles

One row per authenticated user. Private user settings.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | references `auth.users(id)` ON DELETE CASCADE |
| `full_name` | text | |
| `base_currency` | text NOT NULL | default `'MXN'` |
| `monthly_investment_amount` | numeric(14,2) NOT NULL | default 0, check >= 0 |
| `investment_day` | int NOT NULL | default 1, check 1–31 |
| `risk_profile` | text NOT NULL | conservative / balanced / growth / aggressive_growth |
| `time_horizon` | text NOT NULL | 1_3_years / 3_5_years / 5_10_years / 10_plus_years |
| `broad_etf_priority` | boolean NOT NULL | default true; boosts broad ETF recommendation scores |
| `cash_reserve_percent` | numeric(5,2) NOT NULL | default 5; % of monthly amount held as cash |
| `max_individual_stock_percent` | numeric(5,2) NOT NULL | default 15; concentration block threshold |
| `onboarding_completed` | boolean NOT NULL | default false |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

**B1 migration:** see `supabase/migrations/001_profiles.sql` and `Docs/supabasechema.md`.

---

## portfolios

User-owned portfolio container.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL FK | references `auth.users(id)` ON DELETE CASCADE, unique |
| `name` | text NOT NULL | default `'My Portfolio'` |
| `base_currency` | text NOT NULL | default `'MXN'` |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

v1: one portfolio per user (`unique (user_id)`).

**B2 migration:** see `supabase/migrations/002_portfolio_schema.sql`.

---

## holdings

Current positions owned by the user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL FK | references `auth.users(id)` ON DELETE CASCADE |
| `portfolio_id` | uuid NOT NULL FK | references `portfolios(id)` ON DELETE CASCADE |
| `symbol` | text NOT NULL | e.g. VOO, NVDA |
| `asset_name` | text | |
| `asset_type` | text NOT NULL | etf / stock / cash / crypto / other |
| `currency` | text NOT NULL | default `'MXN'` |
| `shares` | numeric(18,6) | required for market assets once B4.5 ships |
| `current_value` | numeric(14,2) NOT NULL | check >= 0; **computed** from shares × latest price (B4.5). Manual entry is interim B2 only. |
| `cost_basis` | numeric(14,2) | check >= 0 when set; user-entered for P&L |
| `broker` | text | optional |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

Constraints: `unique (portfolio_id, symbol)`.

Weights are based on **current market value**, not cost basis alone.

**B4.5 (planned):** add `last_price`, `last_price_at`, `price_source` on `holdings` (or a quote cache table). See [Market_Data.md](./Market_Data.md).

---

## target_allocations (removed in P1)

Dropped in `supabase/migrations/008_remove_target_allocations.sql` along with `target_buckets` and `target_assets`. Strategy preferences live on `profiles`; buy recommendations come from the decision engine.

---

## watchlist_items

User-curated symbols for monitoring and news-risk prompts. User-scoped (not tied to a portfolio).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL FK | references `auth.users(id)` ON DELETE CASCADE |
| `symbol` | text NOT NULL | |
| `asset_name` | text | |
| `asset_type` | text | etf / stock (nullable) |
| `bucket` | text | core_etf / growth (nullable) |
| `enabled` | boolean NOT NULL | default true |
| `sort_order` | int NOT NULL | default 0 |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

Constraints: `unique (user_id, symbol)`.

---

## monthly_plans

One generated buy plan per portfolio per month.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL FK | references `auth.users(id)` ON DELETE CASCADE |
| `portfolio_id` | uuid NOT NULL FK | references `portfolios(id)` ON DELETE CASCADE |
| `month` | text NOT NULL | `YYYY-MM` format |
| `monthly_amount` | numeric(14,2) NOT NULL | check >= 0 |
| `currency` | text NOT NULL | default `'MXN'` |
| `status` | text NOT NULL | `draft` / `confirmed` / `completed` |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

Constraints: `unique (portfolio_id, month)`.

**B4 migration:** see `supabase/migrations/004_monthly_plans.sql`.

---

## monthly_plan_items

Per-symbol line items within a monthly plan.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `monthly_plan_id` | uuid NOT NULL FK | references `monthly_plans(id)` ON DELETE CASCADE |
| `symbol` | text NOT NULL | normalized uppercase |
| `recommendation_score` | numeric(6,2) | composite engine score |
| `technical_score` | numeric(6,2) | technical composite |
| `news_modifier_score` | numeric(6,2) | news bias score |
| `risk_score` | numeric(6,2) | risk-adjusted score |
| `concentration_flag` | boolean NOT NULL | default false |
| `manual_review_required` | boolean NOT NULL | default false |
| `decision_basis` | text | engine rationale summary |
| `recommended_amount` | numeric(14,2) NOT NULL | check >= 0; engine output |
| `adjusted_amount` | numeric(14,2) NOT NULL | check >= 0; user-editable buy amount |
| `reason` | text NOT NULL | human-readable status |
| `created_at` | timestamptz NOT NULL | default now() |

Constraints: `unique (monthly_plan_id, symbol)`.

RLS on items is scoped through `monthly_plans.user_id` ownership.

---

## manual_news_inputs

Structured ChatGPT report data entered manually by the user. Uses a **hybrid header/child model** in a single table.

```
Report header row (is_report_header = true)
  ├── payload jsonb — full validated ChatGPT JSON
  └── child rows (parent_id → header)
        ├── daily/monthly: symbol + news_score, news_direction, ...
        └── weekly: symbol + reason, risk_level, suggested_frontend_status
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `portfolio_id` | uuid FK | references `portfolios(id)` |
| `parent_id` | uuid FK nullable | self-reference; null on header rows |
| `is_report_header` | boolean | `true` = full report JSON in `payload` |
| `report_type` | text | `daily_urgent_scan` / `weekly_market_review` / `monthly_allocation_review` |
| `report_period` | text | `YYYY-MM-DD` (daily/weekly) or `YYYY-MM` (monthly) |
| `payload` | jsonb | NOT NULL on header rows only |
| `symbol` | text | child rows only |
| `asset_type` | text | `etf` / `stock` (child rows) |
| `news_score` | numeric(5,2) | 0–100 |
| `news_direction` | text | positive / neutral / negative / mixed |
| `news_confidence` | numeric(5,2) | 0–100 |
| `ai_bias` | text | add / hold / watch / reduce / avoid |
| `impact_horizon` | text | short_term / medium_term / long_term |
| `event_type` | text | |
| `risk_flags` | text[] | |
| `one_sentence_reason` | text | |
| `source_count` | int | |
| `reason` | text | weekly child rows |
| `risk_level` | text | low / medium / high |
| `suggested_frontend_status` | text | normal / watch / reduce_new_buys / manual_review |

Constraints: unique header per `(portfolio_id, report_type, report_period)`.

Validation: [`lib/validation/news-input.ts`](../../lib/validation/news-input.ts). Server CRUD: [`lib/server/news-inputs.ts`](../../lib/server/news-inputs.ts).

RLS: authenticated users CRUD own rows; portfolio ownership enforced on insert/update.

---

## B1 Implemented Subset — profiles DDL

The following is the canonical B1 migration (from `Docs/supabasechema.md`):

```sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  base_currency text not null default 'MXN',
  monthly_investment_amount numeric(14, 2) not null default 0
    check (monthly_investment_amount >= 0),
  investment_day int not null default 1
    check (investment_day between 1 and 31),
  risk_profile text not null default 'growth'
    check (risk_profile in ('conservative', 'balanced', 'growth', 'aggressive_growth')),
  time_horizon text not null default '10_plus_years'
    check (time_horizon in ('1_3_years', '3_5_years', '5_10_years', '10_plus_years')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger, handle_new_user trigger, RLS policies, indexes
-- see supabase/migrations/001_profiles.sql for full migration
```

---

## B2 Implemented Subset — portfolio DDL

Full migration: `supabase/migrations/002_portfolio_schema.sql`

Tables: `portfolios`, `holdings`, `target_allocations`, `watchlist_items`

TypeScript types: `types/database.ts`

---

## Migration Status

| Table | Milestone | Status |
|-------|-----------|--------|
| profiles | B1 | Implemented — `001_profiles.sql` |
| portfolios | B2 | Implemented — `002_portfolio_schema.sql` |
| holdings | B2 | Implemented — `002_portfolio_schema.sql` |
| holdings quote columns | B4.5 | Implemented — `005_market_data.sql` |
| target_allocations | B2 | **Removed P1** — `008_remove_target_allocations.sql` |
| watchlist_items | B2 | Implemented — `002_portfolio_schema.sql` |
| symbol_market_cache | B4.5 | Implemented — `005_market_data.sql` |
| monthly_plans | B4 | Implemented — `004_monthly_plans.sql` |
| monthly_plan_items | B4 | Implemented — `004_monthly_plans.sql` |
| manual_news_inputs | B5 | Implemented — `006_manual_news_inputs.sql` |
