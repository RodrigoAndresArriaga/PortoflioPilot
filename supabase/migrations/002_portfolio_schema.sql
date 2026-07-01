-- =========================================================
-- PortfolioPilot B2 — Portfolio Schema
-- =========================================================

-- =========================================================
-- 1. Portfolios Table
-- =========================================================

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null default 'My Portfolio',

  base_currency text not null default 'MXN',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id)
);

comment on table public.portfolios is
'User-owned portfolio container. v1: one portfolio per user.';

comment on column public.portfolios.base_currency is
'Display and calculation currency for this portfolio.';


-- =========================================================
-- 2. Holdings Table
-- =========================================================

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  symbol text not null,

  asset_name text,

  asset_type text not null
    check (
      asset_type in (
        'etf',
        'stock',
        'cash',
        'crypto',
        'other'
      )
    ),

  currency text not null default 'MXN',

  shares numeric(18, 6),

  current_value numeric(14, 2) not null
    check (current_value >= 0),

  cost_basis numeric(14, 2)
    check (cost_basis is null or cost_basis >= 0),

  broker text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (portfolio_id, symbol)
);

comment on table public.holdings is
'Current positions owned by the user. Weights use current_value, not cost_basis alone.';


-- =========================================================
-- 3. Target Allocations Table
-- =========================================================

create table if not exists public.target_allocations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  symbol text not null,

  bucket text not null
    check (
      bucket in (
        'core_etf',
        'growth',
        'individual_stock',
        'cash'
      )
    ),

  target_percent numeric(5, 2) not null
    check (target_percent >= 0 and target_percent <= 100),

  max_percent numeric(5, 2)
    check (max_percent is null or (max_percent >= 0 and max_percent <= 100)),

  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (portfolio_id, symbol)
);

comment on table public.target_allocations is
'Target weight per symbol within a portfolio bucket.';


-- =========================================================
-- 4. Watchlist Items Table
-- =========================================================

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  symbol text not null,

  asset_name text,

  asset_type text
    check (asset_type is null or asset_type in ('etf', 'stock')),

  bucket text
    check (bucket is null or bucket in ('core_etf', 'growth')),

  enabled boolean not null default true,

  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, symbol)
);

comment on table public.watchlist_items is
'User-curated symbols for monitoring and news-risk prompts.';


-- =========================================================
-- 5. Updated At Triggers
-- =========================================================

drop trigger if exists set_portfolios_updated_at on public.portfolios;

create trigger set_portfolios_updated_at
before update on public.portfolios
for each row
execute function public.set_updated_at();

drop trigger if exists set_holdings_updated_at on public.holdings;

create trigger set_holdings_updated_at
before update on public.holdings
for each row
execute function public.set_updated_at();

drop trigger if exists set_target_allocations_updated_at on public.target_allocations;

create trigger set_target_allocations_updated_at
before update on public.target_allocations
for each row
execute function public.set_updated_at();

drop trigger if exists set_watchlist_items_updated_at on public.watchlist_items;

create trigger set_watchlist_items_updated_at
before update on public.watchlist_items
for each row
execute function public.set_updated_at();


-- =========================================================
-- 6. Enable Row Level Security
-- =========================================================

alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.target_allocations enable row level security;
alter table public.watchlist_items enable row level security;


-- =========================================================
-- 7. RLS Policies — portfolios
-- =========================================================

drop policy if exists "Users can view own portfolios" on public.portfolios;
drop policy if exists "Users can insert own portfolios" on public.portfolios;
drop policy if exists "Users can update own portfolios" on public.portfolios;
drop policy if exists "Users can delete own portfolios" on public.portfolios;

create policy "Users can view own portfolios"
on public.portfolios
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own portfolios"
on public.portfolios
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own portfolios"
on public.portfolios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own portfolios"
on public.portfolios
for delete
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 8. RLS Policies — holdings
-- =========================================================

drop policy if exists "Users can view own holdings" on public.holdings;
drop policy if exists "Users can insert own holdings" on public.holdings;
drop policy if exists "Users can update own holdings" on public.holdings;
drop policy if exists "Users can delete own holdings" on public.holdings;

create policy "Users can view own holdings"
on public.holdings
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own holdings"
on public.holdings
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own holdings"
on public.holdings
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

create policy "Users can delete own holdings"
on public.holdings
for delete
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 9. RLS Policies — target_allocations
-- =========================================================

drop policy if exists "Users can view own target allocations" on public.target_allocations;
drop policy if exists "Users can insert own target allocations" on public.target_allocations;
drop policy if exists "Users can update own target allocations" on public.target_allocations;
drop policy if exists "Users can delete own target allocations" on public.target_allocations;

create policy "Users can view own target allocations"
on public.target_allocations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own target allocations"
on public.target_allocations
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own target allocations"
on public.target_allocations
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

create policy "Users can delete own target allocations"
on public.target_allocations
for delete
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 10. RLS Policies — watchlist_items
-- =========================================================

drop policy if exists "Users can view own watchlist items" on public.watchlist_items;
drop policy if exists "Users can insert own watchlist items" on public.watchlist_items;
drop policy if exists "Users can update own watchlist items" on public.watchlist_items;
drop policy if exists "Users can delete own watchlist items" on public.watchlist_items;

create policy "Users can view own watchlist items"
on public.watchlist_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own watchlist items"
on public.watchlist_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own watchlist items"
on public.watchlist_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own watchlist items"
on public.watchlist_items
for delete
to authenticated
using (auth.uid() = user_id);


-- =========================================================
-- 11. Helpful Indexes
-- =========================================================

create index if not exists holdings_portfolio_id_idx
on public.holdings (portfolio_id);

create index if not exists holdings_user_id_idx
on public.holdings (user_id);

create index if not exists holdings_symbol_idx
on public.holdings (symbol);

create index if not exists target_allocations_portfolio_id_idx
on public.target_allocations (portfolio_id);

create index if not exists target_allocations_user_id_idx
on public.target_allocations (user_id);

create index if not exists watchlist_items_user_id_idx
on public.watchlist_items (user_id);
