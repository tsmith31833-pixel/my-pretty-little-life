-- My Pretty Little Life, phase 5: your profile settings.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- { "name": "Mrs. Presberry", "sleepGoalHours": 8, "stepGoal": 8000 }
alter table public.settings add column if not exists profile jsonb;
