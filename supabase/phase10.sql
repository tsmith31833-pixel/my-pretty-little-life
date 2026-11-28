-- My Pretty Little Life: Winter Arc, content performance and competitor tracking.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- ---------- 12-week arcs (Winter Arc) ----------
create table if not exists public.arcs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null default 'Winter Arc',
  start_day  date not null,
  data       jsonb not null default '{}'::jsonb,   -- goals, daily non-negotiables, and the 12 weeks
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Performance numbers on your own posts ----------
alter table public.content_items add column if not exists url text;
alter table public.content_items add column if not exists views integer check (views >= 0);      -- views, or impressions on Pinterest
alter table public.content_items add column if not exists likes integer check (likes >= 0);
alter table public.content_items add column if not exists comments integer check (comments >= 0);
alter table public.content_items add column if not exists saves integer check (saves >= 0);
alter table public.content_items add column if not exists shares integer check (shares >= 0);
alter table public.content_items add column if not exists clicks integer check (clicks >= 0);    -- outbound/link clicks
alter table public.content_items add column if not exists stats_updated date;

-- ---------- Competitors and their posts ----------
create table if not exists public.competitors (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  platform   text not null default 'YouTube',
  handle     text,          -- e.g. @creatorname
  url        text,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.competitor_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  platform      text not null default 'YouTube',
  title         text not null,
  url           text,
  format        text,
  pillar        text,
  posted_day    date,
  views         integer check (views >= 0),
  likes         integer check (likes >= 0),
  comments      integer check (comments >= 0),
  saves         integer check (saves >= 0),
  clicks        integer check (clicks >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists competitor_posts_comp on public.competitor_posts (competitor_id);

-- ---------- Privacy rules: owner only, and only after the authenticator code ----------
do $$
declare t text;
begin
  foreach t in array array['arcs', 'competitors', 'competitor_posts'] loop
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
