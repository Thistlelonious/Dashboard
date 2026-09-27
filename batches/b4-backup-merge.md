# b4. Backup and merge

**Goal.** Data moves between devices through backup files that merge record by record.

**Depends on.** b3.

**New dependencies.** `zod`.

## Build

1. Write `src/storage/backup.ts`.
   - A backup file is `{ app: "coinvoice", version: 1, exportedAt, stores }`, where `stores` holds every record of every store, deleted records included.
   - `exportBackup` reads every store the database has, so stores added by later batches join backups with no change here.
   - `mergeBackup(local, incoming)` is pure. For each record id, the newer `updatedAt` wins, and a tie keeps the local record. It returns the merged records and counts of added, updated, and unchanged records.
2. Parse backup files with a `zod` schema. A file from another app or an unknown version gets a clear error, and nothing changes.
3. Build the Setup screen's Backup section.
   - "Send backup" builds `coinvoice-backup-YYYY-MM-DD.json`. If `navigator.canShare({ files })` is true, it opens the share sheet. Otherwise it downloads the file. It sets `lastBackupAt`.
   - "Merge backup" takes a file, shows the counts, and writes only after you press "Merge".
4. Show a banner above every screen when no backup was ever sent ("No backup yet") or the last one is more than 14 days old ("Last backup 15 days ago"). It links to Setup.
5. On first run, call `navigator.storage.persist()`. The Setup screen shows "Storage kept" or "Storage may be cleared" from `navigator.storage.persisted()`.

## Tests

- In `src/storage/backup.test.ts`, the newer record wins in both directions, and a tie keeps the local one.
- A deleted record stays deleted after a merge.
- Merging the same file twice gives the same state as merging it once.
- The counts are right, and a file from another app is rejected.

## Stop and check

1. The banner reads "No backup yet" on every screen.
2. Press "Send backup" on the laptop. A file downloads, the banner goes away, and Setup shows today's date. Move the file into `../Files/Backups`.
3. Rename "Lined skirt" to "Lined skirt v2", then merge the backup. The counts show 0 added and 0 updated, and the name stays "Lined skirt v2".
4. In a private window, merge the backup. The counts show the records as added, and your projects and checklist ticks appear.
5. In the main window, delete "Apple pie", send a new backup, and merge it into the private window. "Apple pie" disappears there.
6. Merge any other JSON file. A clear error shows, and nothing changes.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] The owner confirmed every item in "Stop and check".
