-- My Pretty Little Life, phase 4: money, Money & Grace Co., and home.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Run the earlier files first (already done). Safe to run more than once.

-- ---------- Personal finance ----------
create table if not exists public.budgets (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month      text not null check (month ~ '^\d{4}-\d{2}$'),   -- e.g. 2026-11
  income     numeric(12,2) not null default 0,                -- expected income this month
  categories jsonb not null default '[]'::jsonb,              -- [{ "name": "Groceries", "limit": 450 }]
  primary key (user_id, month)
);

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  kind       text not null default 'expense' check (kind in ('expense', 'income')),
  amount     numeric(12,2) not null check (amount > 0),
  category   text not null default 'Other',
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_day on public.transactions (user_id, day desc);

create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  due_day     smallint not null check (due_day between 1 and 31),
  autopay     boolean not null default false,
  paid_months jsonb not null default '[]'::jsonb,   -- ["2026-11"]
  created_at  timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  target     numeric(12,2) not null check (target > 0),
  saved      numeric(12,2) not null default 0 check (saved >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  start_balance numeric(12,2) not null check (start_balance >= 0),
  balance       numeric(12,2) not null check (balance >= 0),
  apr           numeric(5,2),
  min_payment   numeric(12,2),
  created_at    timestamptz not null default now()
);

-- ---------- Money & Grace Co. ----------
create table if not exists public.biz_income (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  amount     numeric(12,2) not null check (amount > 0),
  offer      text not null default 'Coaching',
  client     text,
  created_at timestamptz not null default now()
);
create index if not exists biz_income_user_day on public.biz_income (user_id, day desc);

create table if not exists public.biz_clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  status     text not null default 'Lead' check (status in ('Lead', 'Call booked', 'Active', 'Past')),
  offer      text,
  debt_paid  numeric(12,2) not null default 0 check (debt_paid >= 0),   -- debt this client has paid off
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.biz_launches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  day        date not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Business goals live with your other settings.
alter table public.settings add column if not exists business jsonb;   -- { "revenueGoal": 6000, "debtGoal": 75000, "community": 1284 }

-- ---------- Home ----------
create table if not exists public.meal_plans (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  meals      jsonb not null default '{}'::jsonb,   -- { "0": { "Breakfast": "...", "Lunch": "...", "Dinner": "..." }, ... }
  primary key (user_id, week_start)
);

create table if not exists public.groceries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  aisle      text not null default 'Other',
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.chores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  room       text not null default 'Whole home',
  every_days smallint not null default 7 check (every_days between 1 and 366),
  last_done  date,
  created_at timestamptz not null default now()
);

-- ---------- Privacy rules: owner only, and only after the authenticator code ----------
do $$
declare t text;
begin
  foreach t in array array['budgets', 'transactions', 'bills', 'savings_goals', 'debts',
                           'biz_income', 'biz_clients', 'biz_launches', 'meal_plans', 'groceries', 'chores'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "Owner only" on public.%I', t);
    execute format('create policy "Owner only" on public.%I for all to authenticated
                    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('drop policy if exists "Two-step login required" on public.%I', t);
    execute format('create policy "Two-step login required" on public.%I as restrictive for all to authenticated
                    using ((select auth.jwt() ->> ''aal'') = ''aal2'') with check ((select auth.jwt() ->> ''aal'') = ''aal2'')', t);
  end loop;
end $$;
