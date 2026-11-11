-- My Pretty Little Life: Money & Grace Co. content bank.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

create table if not exists public.content_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  platform   text not null default 'Instagram',
  format     text not null default 'Reel',
  pillar     text not null default 'Debt payoff tips',
  status     text not null default 'Idea' check (status in ('Idea', 'Drafted', 'Scheduled', 'Posted')),
  hook       text,
  caption    text,
  hashtags   text,
  post_day   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_items_user_day on public.content_items (user_id, post_day);

alter table public.content_items enable row level security;
revoke all on public.content_items from anon;

drop policy if exists "Owner only" on public.content_items;
create policy "Owner only" on public.content_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Two-step login required" on public.content_items;
create policy "Two-step login required" on public.content_items
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
