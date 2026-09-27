# b3. Projects and setup

**Goal.** Projects, settings, and the setup checklist are saved on the device.

**Depends on.** b2.

**New dependencies.** `idb`, and `fake-indexeddb` for tests.

## Build

1. Write `src/storage/records.ts` as pure helpers. `newRecord` gives an `id` and `updatedAt`. `touch` updates `updatedAt`. `softDelete` sets `deletedAt`. `live` filters out deleted records.
2. Write `src/storage/db.ts`. It opens the `coinvoice` database at version 1 with the stores `projects`, `checklist`, and `settings`. Later batches add stores by raising the version.
3. Seed on open. Write the four checklist items from `PLAN.md` "Setup checklist" with fixed ids and `seeded: true`, and the default settings, only when they are missing. The default settings are an empty business name, a 10.5% tax rate, a 50% deposit, and 30 valid days. Seeding twice changes nothing.
4. Build Home's Projects and New project sections from SewAndSo's Workroom.
   - Each project is a ProjectCard in its `hue`, with the domain's `cardIcon` as art. A domain with no `cardIcon`, which is pies for now, gets the plain hue block. A sewing card shows the StageTrack, with every stage "todo" until the project is built. A pie card has no track. A card opens `#/price/<projectId>`.
   - "New project" takes a name, a domain, and a hue from Swatches.
5. Build the Price screen's Project section. It shows the selected project with "Rename" and "Delete". Calculator inputs save to the selected project as they change. A sewing project can remove its Fit stage and add it back. Stage budgets then divide by the remaining weights.
6. Until batch 8, the materials input is stored as one fixed material line named "Materials".
7. Build the Setup screen's Settings and Checklist sections.
   - Settings edits the business name, tax rate, deposit, and valid days.
   - Checklist shows each item with a checkbox and its reason. "Add item" adds your own. Your own items can be deleted. Seeded items can only be checked.

## Tests

- `src/storage/records.test.ts` covers `touch`, `softDelete`, and `live`.
- `src/storage/db.test.ts` uses `fake-indexeddb`. Seeding twice leaves four checklist items and one settings record.

## Stop and check

1. On Home, create a sewing project called "Lined skirt" in plum. A plum card appears with the fabric icon and a four-stage track, all dashed. Open it, and enter the skirt example from batch 2. Reload. The values and 84.7 minutes are back.
2. Create a pie project called "Apple pie" in marigold. Its card has no track. Open each project from its card. The address changes to `#/price/<id>`.
3. In "Lined skirt", remove Fit. The stage budgets become 19.9, 44.8, and 19.9 minutes, and the card's track shows three stages. Add Fit back.
4. Rename a project, then delete one. Reload. The deleted project stays gone.
5. On Setup, the four seeded checklist items show. Tick one, and add "Order business cards". Reload. Both changes remain. Delete your own item.
6. Change each setting and reload. The changes remain.
7. Open a private window. The seeded checklist shows once, and there are no projects.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] The owner confirmed every item in "Stop and check".
