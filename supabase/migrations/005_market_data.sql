-- =========================================================
-- PortfolioPilot B4.5 — Market Data
-- =========================================================

alter table public.holdings
add column if not exists last_price numeric(18, 6),
add column if not exists last_price_at timestamptz,
add column if not exists price_source text default 'yahoo';

comment on column public.holdings.last_price is
'Latest fetched market price in holding currency.';
comment on column public.holdings.last_price_at is
'Timestamp of last_price fetch.';
comment on column public.holdings.price_source is
'Quote provider identifier, e.g. yahoo.';

-- =========================================================
-- Shared symbol quote cache
-- =========================================================

create table if not exists public.symbol_market_cache (
  symbol text primary key,

  latest_price numeric(18, 6),
  currency text not null default 'USD',
  quoted_at timestamptz,

  history_json jsonb,
  history_fetched_at timestamptz,

  updated_at timestamptz not null default now()
);

comment on table public.symbol_market_cache is
'Shared Yahoo quote and price history cache keyed by symbol.';

drop trigger if exists set_symbol_market_cache_updated_at on public.symbol_market_cache;

create trigger set_symbol_market_cache_updated_at
before update on public.symbol_market_cache
for each row
execute function public.set_updated_at();

alter table public.symbol_market_cache enable row level security;

drop policy if exists "Authenticated users can read symbol market cache"
on public.symbol_market_cache;

create policy "Authenticated users can read symbol market cache"
on public.symbol_market_cache
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can upsert symbol market cache"
on public.symbol_market_cache;

create policy "Authenticated users can upsert symbol market cache"
on public.symbol_market_cache
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update symbol market cache"
on public.symbol_market_cache;

create policy "Authenticated users can update symbol market cache"
on public.symbol_market_cache
for update
to authenticated
using (true)
with check (true);

create index if not exists symbol_market_cache_quoted_at_idx
on public.symbol_market_cache (quoted_at);
