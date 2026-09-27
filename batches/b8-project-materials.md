# b8. Project materials

**Goal.** Projects draw materials from stock, and "Mark built" uses that stock.

**Depends on.** b7.

**New dependencies.** None.

## Build

1. Replace the Price screen's single materials number with a list of material lines. You can add a stock line (an item, a quantity, and a unit), a planned purchase (a name, quantity, unit, and estimated unit cost), or a fixed line (a name and a cost). You can remove any line. A project's existing "Materials" fixed line stays as it is.
2. Write `materialsCost(project, ledger)` as a pure function. A stock line costs its quantity, converted to the item's unit, times the average cost, or its `frozenCost` once the project is built. A planned line costs quantity times unit cost. A fixed line costs its amount. Each line rounds half up, and the total feeds the calculator.
3. A stock line that needs more than is on hand shows a warning, such as "Only 1.5 yd on hand."
4. "Mark built" records a build use for each stock line, dated now, freezes each line's cost, and sets `built`. "Undo built" soft-deletes that project's build uses, clears the frozen costs, and clears `built`.

## Tests

- `materialsCost` totals a project with stock, planned, and fixed lines.
- After "Mark built", a new purchase at a different price leaves the project's cost unchanged.
- "Undo built" returns the stock to its earlier on-hand quantity.

## Stop and check

1. In "Lined skirt", replace the "Materials" line with 1.5 yd of cotton lawn and 1 zipper from stock, a fixed "Pattern share" at $3.00, and a planned "Interfacing" of 0.25 yd at $4.00 per yard. The materials total is $26.65, and the calculator updates.
2. Change the cotton lawn to 2 yd. A warning says only 1.5 yd is on hand. Change it back.
3. Press "Mark built". Stock shows 0 yd of cotton lawn and 0 zippers.
4. Add a cotton lawn purchase at a different price. The skirt's materials total stays $26.65.
5. Press "Undo built". The stock comes back.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
