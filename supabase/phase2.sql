-- My Pretty Little Life, phase 2: calendar events, to-dos and goals.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Run schema.sql first (already done in phase 1). Safe to run more than once.

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  day        date not null,
  start_min  smallint check (start_min between 0 and 1439),   -- minutes after midnight; empty = all day
  minutes    smallint not null default 60 check (minutes between 5 and 1440),
  tag        text not null default 'Me time',
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists events_user_day on public.events (user_id, day);

create table if not exists public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 300),
  list       text not null default 'Personal',
  due        date,
  done       boolean not null default false,
  done_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists todos_user on public.todos (user_id, done, due);

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  area       text not null default 'Glow-up',
  target     date,
  why        text,
  milestones jsonb not null default '[]'::jsonb,   -- [{ "title": "...", "done": false }]
  created_at timestamptz not null default now()
);

-- Same privacy rules as phase 1: owner only, and only after the authenticator code.
do $$
declare t text;
begin
  foreach t in array array['events', 'todos', 'goals'] loop
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
