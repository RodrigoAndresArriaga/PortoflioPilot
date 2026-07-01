-- PortfolioPilot P1 — Remove hard target allocation system

drop table if exists public.target_assets cascade;
drop table if exists public.target_buckets cascade;
drop table if exists public.target_allocations cascade;

alter table public.portfolios drop column if exists allocation_mode;

alter table public.monthly_plan_items
  drop column if exists target_weight,
  drop column if exists current_weight;

alter table public.monthly_plan_items
  add column if not exists recommendation_score numeric(6, 2),
  add column if not exists technical_score numeric(6, 2),
  add column if not exists news_modifier_score numeric(6, 2),
  add column if not exists risk_score numeric(6, 2),
  add column if not exists concentration_flag boolean not null default false,
  add column if not exists manual_review_required boolean not null default false,
  add column if not exists decision_basis text;

alter table public.profiles
  add column if not exists broad_etf_priority boolean not null default true,
  add column if not exists cash_reserve_percent numeric(5, 2) not null default 5
    check (cash_reserve_percent >= 0 and cash_reserve_percent <= 50),
  add column if not exists max_individual_stock_percent numeric(5, 2) not null default 15
    check (max_individual_stock_percent >= 5 and max_individual_stock_percent <= 40);
