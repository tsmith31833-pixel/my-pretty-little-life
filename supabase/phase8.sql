-- My Pretty Little Life: saved hashtag sets for the content bank.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- [{ "id": "debtfree", "name": "Debt-free journey", "tags": "#debtfree #debtfreejourney ..." }]
alter table public.settings add column if not exists hashtag_sets jsonb;
