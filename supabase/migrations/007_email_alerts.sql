-- =========================================================
-- PortfolioPilot M1 — Email Alerts
-- =========================================================

alter table public.profiles
  add column if not exists email_alerts_enabled boolean not null default true,
  add column if not exists email_monthly_plan_ready boolean not null default true,
  add column if not exists email_urgent_risk boolean not null default true,
  add column if not exists email_weekly_summary boolean not null default true,
  add column if not exists email_investment_reminder boolean not null default true,
  add column if not exists email_concentration_warning boolean not null default true,
  add column if not exists email_manual_review boolean not null default true;

comment on column public.profiles.email_alerts_enabled is
'Master toggle for all PortfolioPilot transactional email alerts.';

create table if not exists public.email_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null,
  dedup_key text not null,
  sent_at timestamptz not null default now()
);

comment on table public.email_notification_log is
'Dedup log for cron and event-driven email alerts. Service role writes only.';

create unique index if not exists email_notification_log_dedup_idx
on public.email_notification_log (user_id, alert_type, dedup_key);

create index if not exists email_notification_log_user_sent_idx
on public.email_notification_log (user_id, sent_at desc);

alter table public.email_notification_log enable row level security;

-- no user policies — cron/dispatch uses service role
