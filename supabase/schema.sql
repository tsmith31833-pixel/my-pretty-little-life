-- My Pretty Little Life: database tables and privacy rules.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.

-- One row per day: top priorities, water, mood, daily wins.
create table if not exists public.day_entries (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  priorities jsonb not null default '[]'::jsonb,
  water      smallint not null default 0 check (water between 0 and 8),
  mood       text,
  wins       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- One row per week (starting Sunday): which habits were done on which days.
create table if not exists public.habit_weeks (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  checks     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Turn on row-level security: nothing is readable unless a rule allows it.
alter table public.day_entries enable row level security;
alter table public.habit_weeks enable row level security;

-- Logged-out visitors get no access at all.
revoke all on public.day_entries from anon;
revoke all on public.habit_weeks from anon;

-- Rule 1: you can only see and change your own rows.
drop policy if exists "Owner only" on public.day_entries;
create policy "Owner only" on public.day_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owner only" on public.habit_weeks;
create policy "Owner only" on public.habit_weeks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Rule 2: only after the authenticator code step (a password alone is not enough).
drop policy if exists "Two-step login required" on public.day_entries;
create policy "Two-step login required" on public.day_entries
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "Two-step login required" on public.habit_weeks;
create policy "Two-step login required" on public.habit_weeks
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
