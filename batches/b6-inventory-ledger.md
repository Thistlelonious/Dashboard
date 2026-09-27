# b6. Inventory ledger

**Goal.** Stock on hand and average cost come from a ledger of purchases and uses.

**Depends on.** b5.

**New dependencies.** None.

## Build

1. Raise the database to version 2 with the stores `items`, `purchases`, and `stockUses`. Backups pick them up with no change.
2. Write `src/inventory/units.ts`. It holds the unit families from `PLAN.md` "Inventory" and `convert(qty, from, to, item)`. Conversion across families uses the item's `crossConversion`. Any other pair returns an error.
3. Write `src/inventory/ledger.ts`. `replay(items, purchases, uses)` returns each item's on-hand quantity and average unit cost in the item's unit.
   - Events run in date order, then `updatedAt` order.
   - A purchase adds its quantity and landed cost.
   - A use removes its quantity at the average cost at that moment.
   - The ledger keeps unrounded cents. Round half up only when a cost leaves the ledger, for display or when it is frozen into a project or snapshot.
   - Negative stock is allowed and flagged.
4. Build the Stock screen.
   - Items are grouped by category, each with its on-hand quantity and average cost per unit.
   - "Add purchase" takes a new or existing item (name, category, domain, and unit for a new one), vendor, date, quantity, unit, and the total paid. Its `receiptId` is `manual-<id>`.
   - "Adjust" records a quantity used for waste or personal use.
5. Build the Item screen at `#/stock/<itemId>`. It shows on hand, average cost, the cross-family conversion, a purchase table (date, vendor, quantity, landed cost, unit cost), and a list of uses.

## Tests

- `src/inventory/ledger.test.ts` covers the average cost example in `PLAN.md`.
- A use between two purchases is costed from the first purchase only.
- `src/inventory/units.test.ts` covers 1.5 yd = 54 in, 1 lb = 16 oz, flour cups to ounces through its cross conversion, and an error for yards to pounds.

## Stop and check

1. Add a purchase of "Bemberg lining", 1 yd for $6.00. Stock shows 1 yd at $6.00 per yard.
2. Add 2 yd for $15.00. Stock shows 3 yd at $7.00 per yard.
3. Adjust 1 yd as waste. Stock shows 2 yd at $7.00 per yard.
4. The lining's item screen lists both purchases, at $6.00 and $7.50 per yard.
5. Add "Flour, all-purpose", 5 lb for $3.90, with 1 cup = 4.25 oz. Its item screen shows 5 lb at $0.78 per pound.
6. Send a backup and merge it into a private window. The inventory appears there.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
