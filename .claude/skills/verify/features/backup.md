# Backup

Backups carry records between devices. "Send backup" saves every record to a JSON file. "Merge backup" previews what a file would change and merges it record by record. A banner on every screen asks for a backup when none was sent or the last one is more than 14 days old.

## Sub-features

- `backup-banner` shows "No backup yet" or "Last backup N days ago", with a "Back up" link to Setup.
- `backup-send` downloads `coinvoice-backup-YYYY-MM-DD.json` on a laptop, or opens the share sheet on a phone.
- `backup-preview` shows "N added, N updated, N unchanged" before anything is written.
- `backup-merge` writes the merge after "Merge" and shows "Merged." with the counts.
- `backup-reject` shows a message for a file that isn't a coinvoice backup and changes nothing.
- `storage-status` shows "Storage kept" or "Storage may be cleared".

## How to get to it (user POV)

- Open `#/setup` and use the Backup section.
- Choose "Back up" on the banner.

## Driving it with drive.mjs

Preconditions:

- The baseline state. For a merge between devices, a second context from `browser.newContext()` acts as the second device.

- **Banner.** `open("#/")`. The `aside.sas-panel` reads "No backup yet".
- **Send.** On `#/setup`, wait for the `download` event, click "Send backup", and save the file into `evidence`. The banner disappears, and Setup shows "Last backup" with today's date.
- **Preview.** Wait for the `filechooser` event, click "Merge backup", and set the saved file. The counts line appears with "Merge" and "Cancel" buttons.
- **Merge.** Click "Merge". The `status` role reads "Merged." and the counts.
- **Reject.** Choose a JSON file from anywhere else. The `alert` role reads "This file isn't a coinvoice backup. Pick a file you sent from Setup."
- **Stale banner.** Set `page.clock.setFixedTime()` to a date, send a backup, move the clock 15 days on, and reload. The banner reads "Last backup 15 days ago".
- **Proof.** `recipes/backup.mjs` runs the banner, send, preview, and merge steps.

## Gotchas

- A touch-screen profile such as Pixel 7 tries the share sheet first. Headless Chromium on Linux has no share sheet, so it falls back to the download.
- The last backup date belongs to the device that sent it. Merging another device's backup never clears that device's banner.
- The file input is hidden. Drive it through the "Merge backup" button and the `filechooser` event.
