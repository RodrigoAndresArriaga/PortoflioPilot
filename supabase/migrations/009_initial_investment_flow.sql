-- PortfolioPilot P2 — Initial investment recommendation flow

-- =========================================================
-- 1. Profile updates
-- =========================================================

alter table public.profiles
  add column if not exists investment_status text not null default 'unknown'
  check (
    investment_status in (
      'unknown',
      'not_invested_yet',
      'has_investments'
    )
  );

alter table public.profiles
  add column if not exists initial_investment_amount numeric(14, 2)
  check (initial_investment_amount is null or initial_investment_amount >= 0);

alter table public.profiles
  add column if not exists setup_attention_dismissed boolean not null default false;

-- =========================================================
-- 2. Initial recommendation reports
-- =========================================================

create table if not exists public.initial_recommendation_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  report_date date not null default current_date,
  report_type text not null default 'initial_investment_research',

  user_currency text not null,
  monthly_investment_amount numeric(14, 2),
  initial_investment_amount numeric(14, 2),

  risk_profile text,
  time_horizon text,

  market_regime text,
  overall_risk_level text,
  summary text,

  payload_jsonb jsonb not null,

  created_at timestamptz not null default now()
);

alter table public.initial_recommendation_reports enable row level security;

create policy "Users can view own initial recommendation reports"
on public.initial_recommendation_reports
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own initial recommendation reports"
on public.initial_recommendation_reports
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own initial recommendation reports"
on public.initial_recommendation_reports
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own initial recommendation reports"
on public.initial_recommendation_reports
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- 3. Initial recommendation items
-- =========================================================

create table if not exists public.initial_recommendation_items (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  report_id uuid not null references public.initial_recommendation_reports(id) on delete cascade,

  symbol text not null,
  asset_name text,
  asset_type text not null,

  suggested_role text,
  recommendation_direction text,
  ai_bias text,
  news_direction text,

  fundamental_score numeric(6, 2),
  news_score numeric(6, 2),
  news_confidence numeric(6, 2),
  risk_score numeric(6, 2),
  valuation_risk text,

  event_type text,
  impact_horizon text,
  risk_flags text[] not null default '{}',
  source_count int not null default 0,

  one_sentence_reason text,
  manual_notes text,

  created_at timestamptz not null default now()
);

alter table public.initial_recommendation_items enable row level security;

create policy "Users can view own initial recommendation items"
on public.initial_recommendation_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own initial recommendation items"
on public.initial_recommendation_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own initial recommendation items"
on public.initial_recommendation_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own initial recommendation items"
on public.initial_recommendation_items
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- 4. Monthly plans — plan_kind + extended status
-- =========================================================

alter table public.monthly_plans
  add column if not exists plan_kind text not null default 'monthly'
  check (plan_kind in ('monthly', 'initial'));

alter table public.monthly_plans
  drop constraint if exists monthly_plans_status_check;

alter table public.monthly_plans
  add constraint monthly_plans_status_check
  check (status in ('draft', 'confirmed', 'completed', 'initial_recommendation', 'manual_review'));

alter table public.monthly_plans
  drop constraint if exists monthly_plans_portfolio_id_month_key;

alter table public.monthly_plans
  add constraint monthly_plans_portfolio_id_month_plan_kind_key
  unique (portfolio_id, month, plan_kind);
