# Backups

## What happens automatically

Every night at about 3:13 am Eastern, GitHub runs the **Nightly backup** job
(`.github/workflows/nightly-backup.yml`). It:

1. Exports your planner data (everything in the database's `public` area: daily entries and habit weeks).
2. Locks the file with your backup passphrase (AES-256 encryption).
3. Keeps it for 30 days in GitHub → **Actions** → the night's run → **Artifacts**.

If a night fails, GitHub emails you. Click the failed run to see the reason.

## Run a backup right now

GitHub → your repository → **Actions** → **Nightly backup** → **Run workflow** → **Run workflow**.

## Check that a backup worked

Open the latest run. It should have a green check and an artifact named
`planner-backup-YYYY-MM-DD`. The log line "Backup size" shows how big it was.

## Restore (ask Claude to help with this)

1. Download the artifact you want and unzip it. You get `planner-YYYY-MM-DD.dump.gpg`.
2. Unlock it with your backup passphrase:
   ```bash
   gpg --output planner.dump --decrypt planner-YYYY-MM-DD.dump.gpg
   ```
3. Load it back into Supabase (this replaces the current planner tables):
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges --dbname "SESSION_POOLER_CONNECTION_STRING" planner.dump
   ```

If you ever restore into a brand-new Supabase project, your login there gets a new
user ID. Run `supabase/schema.sql` first, restore, then update the `user_id` column
in each table to your new ID.

## Rules

- Keep the backup passphrase in your password manager. Without it, backups can't be opened.
- Never paste the connection string, database password or passphrase into a chat or a file in this repository.
- Every three months, test a restore into a spare Supabase project.
