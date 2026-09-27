# b7. Receipt import

**Goal.** Receipt files from `/add-receipt` import into the ledger with exact landed costs.

**Depends on.** b6.

**New dependencies.** None.

## Build

1. Write `src/imports/receipt.ts`. Its `zod` schema matches `PLAN.md` "Receipts". It rejects a file whose lines do not add up to the subtotal, or whose total is not subtotal minus discount plus shipping plus tax. The error names the gap in dollars.
2. Write `src/inventory/allocate.ts`.
   - `allocate(amount, weights)` splits cents by the largest-remainder method. Equal remainders go to the earlier line.
   - `landedCosts(receipt)` shares tax, shipping, and discount across all lines by line total, then drops the skipped lines. Each kept line's landed cost is its total plus its tax and shipping shares, minus its discount share.
3. Add "Import receipt" to the Stock screen. It takes a file and shows a preview table with the raw text, item name, match (new item, adds to an existing item, or skipped), quantity, unit, and landed cost. "Import" writes the purchases.
   - An existing item matches by name, ignoring case. Other lines create items.
   - Each purchase id is `<receiptId>#<line index>`, so importing the same receipt again overwrites the same records.
4. Add `src/imports/fixtures/receipt-example.json` with the receipt from `PLAN.md` "Worked examples". It has fabric at $18.00 for 1.5 yd, a zipper at $2.50, a skipped personal line at $3.00, and $2.47 tax, for a $25.97 total.

## Tests

- `src/inventory/allocate.test.ts` gives tax shares of $1.89, $0.26, and $0.32 for the example.
- The fabric lands at $19.89, or $13.26 per yard, and the zipper at $2.76.
- Importing the example twice leaves the same records as importing it once.
- A file with a line off by one cent is rejected, and the error names the gap.

## Stop and check

1. Import `src/imports/fixtures/receipt-example.json`. The preview shows cotton lawn as a new item at $19.89, the zipper as a new item at $2.76, and the personal line as skipped.
2. Press "Import". Stock shows cotton lawn, 1.5 yd at $13.26 per yard.
3. Import the same file again. Nothing changes.
4. Change one line total in a copy of the file by one cent and import it. An error names the gap, and nothing changes.
5. Put a real receipt in `../Files/Receipts-and-Sourcing`. In the CLI, run `/add-receipt <path>` and answer its questions. Import the file it writes.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
