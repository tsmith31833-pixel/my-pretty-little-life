# My Pretty Little Life

A private, responsive personal planner for laptop, iPhone and iPad.

## What's here

- **Next.js** (the website) with **Tailwind CSS**
- The approved pink-luxury home screen (`src/components/home/`)
- Design tokens (colors, fonts) at the top of `src/app/globals.css`
- Example content in `src/lib/sample-data.ts` (until the database is connected)

## Run it on a computer

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Privacy

- The site asks search engines not to index it (`public/robots.txt` and page metadata).
- Never commit passwords or secret keys. Keys live in Vercel's environment settings.

## Login and database

- Login: email + password, then a 6-digit authenticator code (`src/app/login`, `src/app/verify`).
- `src/proxy.ts` sends anyone not fully signed in to the login page.
- Database tables and privacy rules: `supabase/schema.sql` (run it in Supabase → SQL Editor).
- Needed environment variables (set in Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  For local development, put them in a `.env.local` file (never committed).

## Settings, export and backups

- Settings (`/settings`): greeting name, sleep and step goals, theme, password change,
  sign out everywhere, and **Download my data** (everything as JSON, spending as CSV).
- Profile settings need `supabase/phase5.sql`.
- Backups: nightly database, weekly photos, and a quarterly **Restore test** that restores
  the newest backups into a throwaway database to prove they open. See `docs/BACKUPS.md`.
