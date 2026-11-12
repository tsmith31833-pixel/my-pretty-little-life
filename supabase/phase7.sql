-- My Pretty Little Life: reusable content templates.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- [{ "id": "yt", "name": "YouTube video", "platform": "YouTube", "format": "Long video", "pillar": "...",
--    "title": "...", "hook": "...", "caption": "...", "hashtags": "..." }]
alter table public.settings add column if not exists content_templates jsonb;
