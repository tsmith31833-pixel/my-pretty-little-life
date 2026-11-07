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
