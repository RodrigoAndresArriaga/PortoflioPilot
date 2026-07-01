-- =========================================================
-- PortfolioPilot B4 — Monthly Plans
-- =========================================================

-- =========================================================
-- 1. Monthly Plans Table
-- =========================================================

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  month text not null
    check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),

  monthly_amount numeric(14, 2) not null
    check (monthly_amount >= 0),

  currency text not null default 'MXN',

  status text not null default 'draft'
    check (status in ('draft', 'confirmed', 'completed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (portfolio_id, month)
);

comment on table public.monthly_plans is
'One generated monthly buy plan per portfolio per month.';


-- =========================================================
-- 2. Monthly Plan Items Table
-- =========================================================

create table if not exists public.monthly_plan_items (
  id uuid primary key default gen_random_uuid(),

  monthly_plan_id uuid not null references public.monthly_plans(id) on delete cascade,

  symbol text not null,

  target_weight numeric(8, 4) not null
    check (target_weight >= 0 and target_weight <= 1),

  current_weight numeric(8, 4) not null
    check (current_weight >= 0 and current_weight <= 1),

  recommended_amount numeric(14, 2) not null
    check (recommended_amount >= 0),

  adjusted_amount numeric(14, 2) not null
    check (adjusted_amount >= 0),

  reason text not null,

  created_at timestamptz not null default now(),

  unique (monthly_plan_id, symbol)
);

comment on table public.monthly_plan_items is
'Per-symbol buy recommendations within a monthly plan.';


-- =========================================================
-- 3. Updated At Trigger
-- =========================================================

drop trigger if exists set_monthly_plans_updated_at on public.monthly_plans;

create trigger set_monthly_plans_updated_at
before update on public.monthly_plans
for each row
execute function public.set_updated_at();


-- =========================================================
-- 4. Enable Row Level Security
-- =========================================================

alter table public.monthly_plans enable row level security;
alter table public.monthly_plan_items enable row level security;


-- =========================================================
-- 5. RLS Policies — monthly_plans
-- =========================================================

drop policy if exists "Users can view own monthly plans" on public.monthly_plans;
drop policy if exists "Users can insert own monthly plans" on public.monthly_plans;
drop policy if exists "Users can update own monthly plans" on public.monthly_plans;
drop policy if exists "Users can delete own monthly plans" on public.monthly_plans;

create policy "Users can view own monthly plans"
on public.monthly_plans
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own monthly plans"
on public.monthly_plans
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own monthly plans"
on public.monthly_plans
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can delete own monthly plans"
on public.monthly_plans
for delete
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 6. RLS Policies — monthly_plan_items
-- =========================================================

drop policy if exists "Users can view own monthly plan items" on public.monthly_plan_items;
drop policy if exists "Users can insert own monthly plan items" on public.monthly_plan_items;
drop policy if exists "Users can update own monthly plan items" on public.monthly_plan_items;
drop policy if exists "Users can delete own monthly plan items" on public.monthly_plan_items;

create policy "Users can view own monthly plan items"
on public.monthly_plan_items
for select
to authenticated
using (
  exists (
    select 1 from public.monthly_plans mp
    where mp.id = monthly_plan_id and mp.user_id = auth.uid()
  )
);

create policy "Users can insert own monthly plan items"
on public.monthly_plan_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.monthly_plans mp
    where mp.id = monthly_plan_id and mp.user_id = auth.uid()
  )
);

create policy "Users can update own monthly plan items"
on public.monthly_plan_items
for update
to authenticated
using (
  exists (
    select 1 from public.monthly_plans mp
    where mp.id = monthly_plan_id and mp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.monthly_plans mp
    where mp.id = monthly_plan_id and mp.user_id = auth.uid()
  )
);

create policy "Users can delete own monthly plan items"
on public.monthly_plan_items
for delete
to authenticated
using (
  exists (
    select 1 from public.monthly_plans mp
    where mp.id = monthly_plan_id and mp.user_id = auth.uid()
  )
);


-- =========================================================
-- 7. Helpful Indexes
-- =========================================================

create index if not exists monthly_plans_user_id_idx
on public.monthly_plans (user_id);

create index if not exists monthly_plans_portfolio_month_idx
on public.monthly_plans (portfolio_id, month);

create index if not exists monthly_plan_items_plan_id_idx
on public.monthly_plan_items (monthly_plan_id);
