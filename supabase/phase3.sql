-- My Pretty Little Life, phase 3: wellness and journal.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Run schema.sql and phase2.sql first (already done). Safe to run more than once.

-- More daily wellness numbers on the existing daily row.
alter table public.day_entries add column if not exists sleep_minutes smallint check (sleep_minutes between 0 and 1440);
alter table public.day_entries add column if not exists steps integer check (steps between 0 and 200000);
alter table public.day_entries add column if not exists routine_checks jsonb not null default '{}'::jsonb;

-- Your personal settings: which habits you track and your self-care routines.
create table if not exists public.settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  habits     jsonb,   -- [{ "id": "skin", "name": "Skincare + SPF" }]
  routines   jsonb,   -- [{ "id": "am", "name": "Morning skincare", "steps": ["Cleanse", "Vitamin C", "SPF"] }]
  updated_at timestamptz not null default now()
);

-- Cycle tracking: one row per period.
create table if not exists public.periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  start_day  date not null,
  end_day    date,
  created_at timestamptz not null default now(),
  check (end_day is null or end_day >= start_day)
);
create index if not exists periods_user_start on public.periods (user_id, start_day desc);

-- Journal: one entry per day, with gratitude lines and photo file names.
create table if not exists public.journal_entries (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  body       text not null default '',
  gratitude  jsonb not null default '["", "", ""]'::jsonb,
  photos     jsonb not null default '[]'::jsonb,   -- storage paths in the journal-photos bucket
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Privacy rules: owner only, and only after the authenticator code.
do $$
declare t text;
begin
  foreach t in array array['settings', 'periods', 'journal_entries'] loop
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

-- Private photo storage. Files live in a folder named after your user ID,
-- and only you (after the authenticator code) can see, add or delete them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-photos', 'journal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Journal photos: owner only" on storage.objects;
create policy "Journal photos: owner only" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select auth.jwt() ->> 'aal') = 'aal2'
  )
  with check (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select auth.jwt() ->> 'aal') = 'aal2'
  );
