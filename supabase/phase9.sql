-- My Pretty Little Life: paycheck budgets (two paychecks a month).
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- [{ "id": "p1", "name": "1st paycheck", "day": 1, "amount": 2600,
--    "items": [{ "id": "i1", "name": "Rent", "amount": 1500, "done": false, "billId": null }] }, ...]
alter table public.budgets add column if not exists paychecks jsonb;
