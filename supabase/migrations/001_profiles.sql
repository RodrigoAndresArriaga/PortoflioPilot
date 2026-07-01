-- =========================================================
-- PortfolioPilot B1 — Supabase Auth + Profiles
-- =========================================================

-- Required extension for UUID generation if needed later.
create extension if not exists "pgcrypto";

-- =========================================================
-- 1. Profiles Table
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,

  base_currency text not null default 'MXN',

  monthly_investment_amount numeric(14, 2) not null default 0
    check (monthly_investment_amount >= 0),

  investment_day int not null default 1
    check (investment_day between 1 and 31),

  risk_profile text not null default 'growth'
    check (
      risk_profile in (
        'conservative',
        'balanced',
        'growth',
        'aggressive_growth'
      )
    ),

  time_horizon text not null default '10_plus_years'
    check (
      time_horizon in (
        '1_3_years',
        '3_5_years',
        '5_10_years',
        '10_plus_years'
      )
    ),

  onboarding_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
'Private user profile settings for PortfolioPilot. One row per authenticated user.';

comment on column public.profiles.monthly_investment_amount is
'User monthly investment contribution amount in their selected base currency.';

comment on column public.profiles.investment_day is
'Preferred monthly investment day, usually 1. If not a trading day, user invests manually on next trading day.';

comment on column public.profiles.onboarding_completed is
'Controls whether the user should be sent to onboarding or dashboard.';


-- =========================================================
-- 2. Updated At Trigger
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


-- =========================================================
-- 3. Auto-Create Profile On Signup
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    base_currency,
    monthly_investment_amount,
    investment_day,
    risk_profile,
    time_horizon,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'MXN',
    0,
    1,
    'growth',
    '10_plus_years',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- 4. Enable Row Level Security
-- =========================================================

alter table public.profiles enable row level security;


-- =========================================================
-- 5. RLS Policies
-- =========================================================

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can delete own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);


-- =========================================================
-- 6. Helpful Indexes
-- =========================================================

create index if not exists profiles_onboarding_completed_idx
on public.profiles (onboarding_completed);

create index if not exists profiles_base_currency_idx
on public.profiles (base_currency);
