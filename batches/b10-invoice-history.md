# b10. Invoice history

**Goal.** The invoice history filters, totals by quarter, and exports to CSV.

**Depends on.** b9.

**New dependencies.** None.

## Build

1. Write `src/documents/history.ts`.
   - `quarterTotals(documents)` groups documents by the date they moved to "Invoiced". It counts invoiced, deposit-paid, and paid documents, and leaves out estimates and void documents.
   - Each quarter has sales before tax, sales tax collected, and profit. Profit uses the actual minutes when known, and the labor budget otherwise.
   - `toCsv(documents)` writes the columns number, estimate number, state, customer, item, invoiced date, price, tax, total, deposit, and profit. It quotes fields that contain commas or quotes.
2. Build the Invoices screen's full Documents table with number, date, customer, item, total, and state. Use SewAndSo's Table, which stacks each row under 600px wide. Add a state filter and a date range filter.
3. Build the Quarter totals section from `quarterTotals`.
4. Add "Export CSV", which downloads `coinvoice-invoices-YYYY-MM-DD.csv`.

## Tests

- `src/documents/history.test.ts` leaves estimates and void documents out of the totals.
- A document invoiced on September 30 lands in Q3, and one invoiced on October 1 lands in Q4.
- A customer name with a comma and a quote survives the CSV.

## Stop and check

1. Create four documents: one left as an estimate, one voided, one invoiced, and one paid. Name one customer `Smith, "Jo"`.
2. The quarter totals count only the invoiced and paid documents. Check the sums by hand.
3. The state filter and the date range narrow the list.
4. On your phone, each document shows as a stacked block, with nothing scrolling sideways.
5. Export the CSV and open it in Excel or Google Sheets. The columns are right, and the customer name is intact.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
