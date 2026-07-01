# Database Schema

Full table catalog for PortfolioPilot. `profiles` is implemented in B1; portfolio tables are implemented in B2; remaining tables are spec-only until their milestone.

---

## Entity Relationships

```
auth.users
  └── profiles (1:1)
  └── portfolios (1:many, v1: 1:1 via unique user_id)
        ├── holdings (1:many)
        ├── target_allocations (1:many)
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
| `shares` | numeric(18,6) | optional |
| `current_value` | numeric(14,2) NOT NULL | check >= 0; required for weight calculations |
| `cost_basis` | numeric(14,2) | check >= 0 when set |
| `broker` | text | optional |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

Constraints: `unique (portfolio_id, symbol)`.

Weights are based on **current market value**, not cost basis alone.

---

## target_allocations

Target weight per symbol within a portfolio bucket.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL FK | references `auth.users(id)` ON DELETE CASCADE |
| `portfolio_id` | uuid NOT NULL FK | references `portfolios(id)` ON DELETE CASCADE |
| `symbol` | text NOT NULL | |
| `bucket` | text NOT NULL | core_etf / growth / individual_stock / cash |
| `target_percent` | numeric(5,2) NOT NULL | check 0–100 |
| `max_percent` | numeric(5,2) | cap for individual stocks; check 0–100 when set |
| `enabled` | boolean NOT NULL | default true |
| `created_at` | timestamptz NOT NULL | default now() |
| `updated_at` | timestamptz NOT NULL | default now(), auto-updated via trigger |

Constraints: `unique (portfolio_id, symbol)`.

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

One plan per portfolio per month.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `portfolio_id` | uuid FK | references `portfolios(id)` |
| `month` | text | e.g. `2026-07` |
| `monthly_amount` | numeric | |
| `currency` | text | |
| `status` | text | draft / confirmed / executed |
| `created_at` | timestamptz | |

---

## monthly_plan_items

Line items within a monthly plan.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `monthly_plan_id` | uuid FK | references `monthly_plans(id)` |
| `symbol` | text | |
| `target_weight` | numeric | |
| `current_weight` | numeric | |
| `recommended_amount` | numeric | algorithm output |
| `adjusted_amount` | numeric | after news modifier |
| `reason` | text | e.g. news risk reduction |

---

## manual_news_inputs

Structured ChatGPT report data entered manually by the user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `symbol` | text | |
| `report_date` | date | |
| `report_type` | text | daily_urgent_scan / weekly_review / monthly_allocation_review |
| `news_score` | numeric | |
| `news_direction` | text | positive / neutral / negative / mixed |
| `news_confidence` | numeric | 0–100 |
| `ai_bias` | text | hold / watch / reduce / avoid |
| `impact_horizon` | text | short_term / medium_term / long_term |
| `event_type` | text | |
| `risk_flags` | text[] | |
| `notes` | text | |

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
| target_allocations | B2 | Implemented — `002_portfolio_schema.sql` |
| watchlist_items | B2 | Implemented — `002_portfolio_schema.sql` |
| monthly_plans | B3 | Spec only |
| monthly_plan_items | B3 | Spec only |
| manual_news_inputs | B6 | Spec only |
