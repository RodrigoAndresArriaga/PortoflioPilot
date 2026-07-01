-- =========================================================
-- PortfolioPilot — Bucket-First Allocation Model
-- =========================================================

alter table public.portfolios
add column if not exists allocation_mode text not null default 'bucket'
  check (allocation_mode in ('auto', 'bucket', 'symbol'));

comment on column public.portfolios.allocation_mode is
'How target weights are defined: auto, bucket-level, or symbol-level.';


-- =========================================================
-- Target Buckets
-- =========================================================

create table if not exists public.target_buckets (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  bucket_key text not null
    check (
      bucket_key in (
        'core_etf',
        'growth_tech',
        'cash_reserve',
        'individual_stock'
      )
    ),

  target_percent numeric(5, 2) not null
    check (target_percent >= 0 and target_percent <= 100),

  min_percent numeric(5, 2)
    check (min_percent is null or (min_percent >= 0 and min_percent <= 100)),

  max_percent numeric(5, 2)
    check (max_percent is null or (max_percent >= 0 and max_percent <= 100)),

  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (portfolio_id, bucket_key)
);

comment on table public.target_buckets is
'Bucket-level target weights for auto and bucket allocation modes.';


-- =========================================================
-- Target Assets
-- =========================================================

create table if not exists public.target_assets (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  symbol text not null,

  bucket_key text not null
    check (
      bucket_key in (
        'core_etf',
        'growth_tech',
        'cash_reserve',
        'individual_stock'
      )
    ),

  target_percent numeric(5, 2)
    check (target_percent is null or (target_percent >= 0 and target_percent <= 100)),

  max_percent numeric(5, 2)
    check (max_percent is null or (max_percent >= 0 and max_percent <= 100)),

  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (portfolio_id, symbol)
);

comment on table public.target_assets is
'Symbol-level targets for advanced users. target_percent null lets the engine rank within a bucket.';


-- =========================================================
-- Updated At Triggers
-- =========================================================

drop trigger if exists set_target_buckets_updated_at on public.target_buckets;

create trigger set_target_buckets_updated_at
before update on public.target_buckets
for each row
execute function public.set_updated_at();

drop trigger if exists set_target_assets_updated_at on public.target_assets;

create trigger set_target_assets_updated_at
before update on public.target_assets
for each row
execute function public.set_updated_at();


-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.target_buckets enable row level security;
alter table public.target_assets enable row level security;


-- target_buckets policies

drop policy if exists "Users can view own target buckets" on public.target_buckets;
drop policy if exists "Users can insert own target buckets" on public.target_buckets;
drop policy if exists "Users can update own target buckets" on public.target_buckets;
drop policy if exists "Users can delete own target buckets" on public.target_buckets;

create policy "Users can view own target buckets"
on public.target_buckets
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own target buckets"
on public.target_buckets
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own target buckets"
on public.target_buckets
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

create policy "Users can delete own target buckets"
on public.target_buckets
for delete
to authenticated
using (auth.uid() = user_id);


-- target_assets policies

drop policy if exists "Users can view own target assets" on public.target_assets;
drop policy if exists "Users can insert own target assets" on public.target_assets;
drop policy if exists "Users can update own target assets" on public.target_assets;
drop policy if exists "Users can delete own target assets" on public.target_assets;

create policy "Users can view own target assets"
on public.target_assets
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own target assets"
on public.target_assets
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own target assets"
on public.target_assets
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

create policy "Users can delete own target assets"
on public.target_assets
for delete
to authenticated
using (auth.uid() = user_id);
