# b9. Documents

**Goal.** Estimates, invoices, and cost sheets print with exact figures, and invoices freeze their numbers.

**Depends on.** b8.

**New dependencies.** None.

## Build

1. Raise the database to version 3 with the store `documents`.
2. Write `src/documents/lifecycle.ts`. The transition table from `PLAN.md` "Lifecycle" is data. `move(document, to, now, source)` returns the new document or an error. Moving to "Invoiced" takes the snapshot. Moving to "Paid" freezes the actual minutes into it.
3. Write `src/documents/snapshot.ts`. `takeSnapshot(project, settings, ledger, domain)` builds a `DocumentSnapshot`. An estimate that is not yet invoiced prints from a snapshot built on the spot, which is never saved.
4. Write `src/documents/numbering.ts`. `nextNumber(prefix, now, existing)` returns `EST-YYYYMMDD-HHMM` or `INV-YYYYMMDD-HHMM`, adding `-2` or `-3` when taken.
5. Add an "Actual minutes" field to projects. The cost sheet uses it until batch 12 adds timers.
6. Build the Invoices screen's Documents section. "New estimate" takes a project, customer name, contact, and item description. The list shows number, customer, and state.
7. Build the Document screen. It shows the details, one button per move the lifecycle allows, and links to the print views. An invoiced document gets an `INV-` number and keeps its estimate number.
8. Build the print views at `#/print/<documentId>/<kind>` from `PLAN.md` "Documents". The cost sheet starts with "Internal. Do not send." SewAndSo's print rules hide the app bar and backdrop. Mark the backup banner and the business-name line `data-print="hide"`. Each document fits one page. If the business name is empty, a line above the document says "Set your business name in Setup before sending this." That line does not print.

## Tests

- In `src/documents/lifecycle.test.ts`, every move in the table works and every other move returns an error. Paid and void documents have no moves.
- After invoicing, a change to an item's cost or the project's price leaves the snapshot unchanged.
- The skirt estimate, pie estimate, and skirt cost sheet match their worked examples.
- `nextNumber` adds `-2` and `-3` for taken numbers.

## Stop and check

1. On Setup, set a business name.
2. Create a project called "Skirt example" with the worked-example inputs: $85, Shopify online, a $32 fixed materials line, $5 overhead, $20 wage, and 20% margin. Create an estimate for "Test customer". In print preview, the estimate shows materials $32.00, sewing labor $53.00, tax $8.93, total $93.93, deposit $46.97, and balance $46.96, on one page in dark type on white, with no app bar or backdrop, even when the app is in the Dark theme.
3. Move it to "Invoiced". It gets an `INV-` number. Change the project price to $90. The invoice still totals $93.93.
4. Set the project's actual minutes to 95. The cost sheet starts with "Internal. Do not send." and shows labor $31.67, profit $13.56, a 16.0% margin, and $28.57 per hour.
5. Move the invoice to "Paid". No more moves are offered.
6. Create a pie estimate at $32 with $14 materials and $3 overhead, cash. It shows baking labor $18.00, no tax line, total $32.00, and deposit $16.00.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
