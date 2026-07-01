-- =========================================================
-- PortfolioPilot B5 — Manual News Inputs
-- =========================================================

create table if not exists public.manual_news_inputs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,

  parent_id uuid references public.manual_news_inputs(id) on delete cascade,
  is_report_header boolean not null default false,

  report_type text not null
    check (report_type in (
      'daily_urgent_scan',
      'weekly_market_review',
      'monthly_allocation_review'
    )),

  report_period text not null,

  payload jsonb,

  symbol text,
  asset_type text check (asset_type is null or asset_type in ('etf', 'stock')),
  news_score numeric(5, 2) check (news_score is null or (news_score >= 0 and news_score <= 100)),
  news_direction text check (
    news_direction is null or news_direction in ('positive', 'neutral', 'negative', 'mixed')
  ),
  news_confidence numeric(5, 2) check (
    news_confidence is null or (news_confidence >= 0 and news_confidence <= 100)
  ),
  ai_bias text check (
    ai_bias is null or ai_bias in ('add', 'hold', 'watch', 'reduce', 'avoid')
  ),
  impact_horizon text check (
    impact_horizon is null or impact_horizon in ('short_term', 'medium_term', 'long_term')
  ),
  event_type text,
  risk_flags text[],
  one_sentence_reason text,
  source_count int check (source_count is null or source_count >= 0),

  reason text,
  risk_level text check (risk_level is null or risk_level in ('low', 'medium', 'high')),
  suggested_frontend_status text check (
    suggested_frontend_status is null or suggested_frontend_status in (
      'normal', 'watch', 'reduce_new_buys', 'manual_review'
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint manual_news_inputs_header_shape check (
    (is_report_header = true and parent_id is null and payload is not null)
    or (is_report_header = false and parent_id is not null and payload is null)
  )
);

comment on table public.manual_news_inputs is
'Hybrid storage: report header rows (payload jsonb) plus normalized symbol/event child rows.';

create unique index if not exists manual_news_inputs_header_unique_idx
on public.manual_news_inputs (portfolio_id, report_type, report_period)
where is_report_header = true;

create index if not exists manual_news_inputs_user_portfolio_idx
on public.manual_news_inputs (user_id, portfolio_id, report_type, report_period)
where is_report_header = true;

create index if not exists manual_news_inputs_parent_idx
on public.manual_news_inputs (parent_id)
where parent_id is not null;

create index if not exists manual_news_inputs_symbol_lookup_idx
on public.manual_news_inputs (portfolio_id, symbol, report_type)
where is_report_header = false and symbol is not null;

drop trigger if exists set_manual_news_inputs_updated_at on public.manual_news_inputs;

create trigger set_manual_news_inputs_updated_at
before update on public.manual_news_inputs
for each row
execute function public.set_updated_at();

alter table public.manual_news_inputs enable row level security;

drop policy if exists "Users can view own manual news inputs" on public.manual_news_inputs;
drop policy if exists "Users can insert own manual news inputs" on public.manual_news_inputs;
drop policy if exists "Users can update own manual news inputs" on public.manual_news_inputs;
drop policy if exists "Users can delete own manual news inputs" on public.manual_news_inputs;

create policy "Users can view own manual news inputs"
on public.manual_news_inputs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own manual news inputs"
on public.manual_news_inputs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and p.user_id = auth.uid()
  )
);

create policy "Users can update own manual news inputs"
on public.manual_news_inputs
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

create policy "Users can delete own manual news inputs"
on public.manual_news_inputs
for delete
to authenticated
using (auth.uid() = user_id);
