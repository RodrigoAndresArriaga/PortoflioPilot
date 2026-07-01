# Database Schema

Full table catalog for PortfolioPilot. Only `profiles` is implemented in B1; remaining tables are spec-only until their milestone.

---

## Entity Relationships

```
auth.users
  └── profiles (1:1)
  └── portfolios (1:many)
        ├── holdings (1:many)
        ├── target_allocations (1:many)
        └── monthly_plans (1:many)
              └── monthly_plan_items (1:many)
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

**B1 migration:** see `Docs/supabasechema.md` for full DDL including triggers, signup handler, indexes, and RLS policies.

---

## portfolios

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `name` | text | |
| `base_currency` | text | |
| `created_at` | timestamptz | |

v1: one portfolio per user.

---

## holdings

Current positions owned by the user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `portfolio_id` | uuid FK | references `portfolios(id)` |
| `symbol` | text | e.g. VOO, NVDA |
| `asset_name` | text | |
| `asset_type` | text | ETF / stock / cash / crypto / other |
| `currency` | text | |
| `shares` | numeric | optional |
| `current_value` | numeric | required for weight calculations |
| `cost_basis` | numeric | |
| `broker` | text | optional |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Weights are based on **current market value**, not cost basis alone.

---

## target_allocations

Target weight per symbol within a portfolio bucket.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | references `auth.users(id)` |
| `portfolio_id` | uuid FK | references `portfolios(id)` |
| `symbol` | text | |
| `bucket` | text | core_etf / growth / individual_stock / cash |
| `target_percent` | numeric | |
| `max_percent` | numeric | cap for individual stocks |
| `enabled` | boolean | |

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
-- see Docs/supabasechema.md for full migration
```

---

## Migration Status

| Table | Milestone | Status |
|-------|-----------|--------|
| profiles | B1 | Spec ready |
| portfolios | B2 | Spec only |
| holdings | B2 | Spec only |
| target_allocations | B2 | Spec only |
| monthly_plans | B3 | Spec only |
| monthly_plan_items | B3 | Spec only |
| manual_news_inputs | B6 | Spec only |
