# b13. Pattern library

**Goal.** Pattern PDFs and photos live on the device and open beside the current stage.

**Depends on.** b12.

**New dependencies.** `pdfjs-dist`.

## Build

1. Raise the database to version 5 with the store `files`, which holds PDFs and photos as blobs. Backups leave this store out.
2. Let a template or project hold attached files. Add "Attach file" to the Build screen's Pattern section.
3. Show the attached PDF in the Build screen's Pattern section, with page controls. Tapping a step reference opens its page. Set up the `pdfjs-dist` worker for Vite.
4. Show the storage used on the Setup screen, from `navigator.storage.estimate()`.

## Tests

- A backup built with files attached contains no `files` store.
- Tapping a step reference asks the viewer for that step's page.

## Stop and check

1. On your phone, attach a PDF of 20 pages or more to "Lined skirt" and open build mode.
2. Tap a step reference. The viewer jumps to its page.
3. Reload. The PDF is still attached.
4. Send a backup. Its file size does not grow by the size of the PDF.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
