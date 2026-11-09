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

## Photo backups

Every Sunday at about 3:43 am Eastern, the **Weekly photo backup** job
(`.github/workflows/weekly-photo-backup.yml`) downloads every journal photo,
packs them into one file, locks it with the same backup passphrase, and keeps it
for 15 days (about two weekly copies) under that run's **Artifacts**.

It needs two extra secrets besides the nightly ones: `SUPABASE_URL` and
`SUPABASE_SECRET_KEY`.

To restore photos:

1. Download and unzip the `photo-backup-YYYY-MM-DD` artifact.
2. Unlock and unpack it:
   ```bash
   gpg --output photos.tar.gz --decrypt photos-YYYY-MM-DD.tar.gz.gpg
   ```
   ```bash
   tar -xzf photos.tar.gz
   ```
3. The `photos/` folder has the same folder layout as the `journal-photos` bucket.
   Upload them back to Supabase Storage (ask Claude to help).

GitHub's free plan includes 500 MB of backup storage in total for private
repositories. The log line "Archive size" shows how big each photo backup is.
If it grows past about 200 MB, move photo backups somewhere larger.

## Restore test (every 3 months)

The **Restore test** job (`.github/workflows/restore-test.yml`) runs on the 2nd of
February, May, August and November, or any time from Actions → Restore test → Run workflow.
It unlocks the newest nightly and photo backups and restores them into a temporary
database inside the job. Your real Supabase project is never touched. The run's summary
lists every table and how many rows came back, plus the photo count.
A few notices about login links are expected, because the temporary database has no real users.
