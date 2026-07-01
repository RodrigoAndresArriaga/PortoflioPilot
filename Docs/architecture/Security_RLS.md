# Security and RLS

Security requirements for PortfolioPilot. Mandatory because the app is shared with friends and family — every user's financial data must remain private.

---

## Core Principles

1. Every user-owned table must include a `user_id` column (or use `id` = `auth.uid()` for profiles).
2. Every user-owned table must have **Row Level Security (RLS) enabled**.
3. Users can only access their own rows — enforced at the database level, not just in application code.
4. Secrets never appear in client-side code or public environment variables.

---

## Standard RLS Policy Pattern

For tables with a `user_id` column, apply four policies:

```sql
-- SELECT
create policy "Users can view own {table}"
on {table}
for select
to authenticated
using (auth.uid() = user_id);

-- INSERT
create policy "Users can insert own {table}"
on {table}
for insert
to authenticated
with check (auth.uid() = user_id);

-- UPDATE
create policy "Users can update own {table}"
on {table}
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE
create policy "Users can delete own {table}"
on {table}
for delete
to authenticated
using (auth.uid() = user_id);
```

---

## B1 Reference — profiles Table

The `profiles` table uses `id` (not `user_id`) as the user identifier because it is a 1:1 extension of `auth.users`.

```sql
alter table public.profiles enable row level security;

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
```

Full migration: `supabase/migrations/001_profiles.sql`

---

## B2 Reference — Portfolio Tables

B2 implements RLS on `portfolios`, `holdings`, `target_allocations`, and `watchlist_items`.

Full migration: `supabase/migrations/002_portfolio_schema.sql`

### portfolios and watchlist_items

Standard four-policy pattern on `user_id` (same as the standard pattern above).

### holdings and target_allocations — portfolio ownership guard

`auth.uid() = user_id` alone is not sufficient for child tables. A client could set their own `user_id` but reference another user's `portfolio_id`.

INSERT and UPDATE policies must verify the portfolio belongs to the caller:

```sql
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
```

The same subquery pattern applies to `target_allocations` insert/update policies.

SELECT and DELETE policies use `auth.uid() = user_id` only.

---

## Tables Requiring RLS (All Milestones)

| Table | User Column | Milestone | Status |
|-------|-------------|-----------|--------|
| profiles | `id` = auth.uid() | B1 | Implemented |
| portfolios | `user_id` | B2 | Implemented |
| holdings | `user_id` | B2 | Implemented |
| target_allocations | `user_id` | B2 | Implemented |
| watchlist_items | `user_id` | B2 | Implemented |
| monthly_plans | `user_id` | B3 | Implemented |
| monthly_plan_items | via `monthly_plans.user_id` join or denormalized `user_id` | B3 | Implemented |
| manual_news_inputs | `user_id` + `portfolio_id` | B5 | Implemented |

For `monthly_plan_items`, either denormalize `user_id` on the row or use a subquery policy checking ownership through `monthly_plans`.

---

## Signup Handler Security

The `handle_new_user()` trigger runs as `security definer` to insert into `profiles` when a new auth user is created. This is the only server-side bypass of RLS for profile creation.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, ...)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), ...)
  on conflict (id) do nothing;
  return new;
end;
$$;
```

---

## Environment Variable Security

| Variable | Exposure | Usage |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client-safe) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client-safe) | Client-side Supabase init; RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only, never public** | Admin operations, bypasses RLS — use sparingly |
| `RESEND_API_KEY` | **Server-only** | Email dispatch in API routes / server actions |
| `NEXT_PUBLIC_APP_URL` | Public | Redirect URLs, email links |

Rules:

- Never prefix server secrets with `NEXT_PUBLIC_`.
- Never import `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Store secrets in `.env.local` (gitignored); commit only `.env.example` with empty values.
- Use Supabase SSR helpers to manage auth cookies securely.

---

## Application-Level Security (Future Milestones)

- Middleware auth check on protected routes (`/dashboard`, `/holdings`, etc.).
- Redirect unauthenticated users to `/auth`.
- Redirect users with `onboarding_completed = false` to `/onboarding`.
- Validate all user input with Zod before database writes (B2+).
- Rate-limit auth endpoints to prevent brute force (Supabase built-in + optional middleware).

---

## What K1 Does Not Include

- No Supabase client initialization
- No auth middleware
- No RLS policies deployed
- No secrets in committed files

Security implementation begins in **B1**. Portfolio table RLS is implemented in **B2**.
