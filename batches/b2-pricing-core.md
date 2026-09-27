# b2. Pricing core

**Goal.** The calculator works in both directions for sewing and pies, backed by tested pure math.

**Depends on.** b1 and bd.

**New dependencies.** None.

## Build

1. Write `src/money.ts`. It holds the `Cents` type, `roundHalfUp`, `toCents` (parses typed dollars such as `85`, `85.5`, or `$1,234.56`, and returns an error for anything else), and `formatCents`.
2. Write `src/pricing/fees.ts` with the four presets from `PLAN.md` "Fee presets".
3. Write `src/pricing/domains/sewing.ts` and `src/pricing/domains/pie.ts` from `PLAN.md` "Domain files". Each one `satisfies Domain`. `src/pricing/domains/index.ts` exports a registry keyed by domain id.
4. Write `src/pricing/pricing.ts` as pure functions.
   - `laborBudget(inputs)` returns `{ kind: "fits", fees, profitTarget, laborBudget, totalMinutes }` or `{ kind: "short", fees, profitTarget, breakEvenPrice }`.
   - `stageBudgets(totalMinutes, stages, allowancePct)` returns each stage's budget and aim-for minutes.
   - `priceForMinutes(inputs, minutes)` returns the price in cents.
   - `estimateTotals({ price, materials, taxRate, taxable, depositPct })` returns labor, subtotal, tax, total, deposit, and balance.
5. Build the Price screen's Inputs and Time per stage sections with SewAndSo.
   - Inputs are the domain (sewing or pie), the mode ("Time from price" or "Price from time"), price or minutes, fee preset, materials, overhead, wage per hour, margin, and batch size.
   - Each number is a SewAndSo Field with its unit ($, %, min).
   - Start with a $20.00 wage, a 20% margin, the "Cash or direct" preset, and the sewing domain. Leave the rest empty.
   - "Time per stage" is a table of each stage's budget and aim-for minutes to one decimal, with a total row. Sewing stages lead with their SewAndSo stage icon. When the batch size is above 1, non-batchable stages also show minutes per unit.
   - Use SewAndSo's Table component, with a `data-label` on every cell so rows stack on phones.
   - "Price from time" shows the price with its fees and profit target.
   - A short result shows "This price can't reach your margin. The break-even price is $X."
   - A bad number puts its Field in the error state with the alert icon and "Use a number, like 85.00".
6. Nothing is saved yet. Batch 3 adds storage.

## Tests

- `src/money.test.ts` covers `roundHalfUp` at 892.5, 4696.5, and 246.5 cents, and `toCents` on `85`, `85.5`, `$1,234.56`, and `abc`.
- `src/pricing/pricing.test.ts` covers the first seven worked examples in `PLAN.md`.
- A $30 Shopify skirt with $32 materials and $5 overhead is short, with a break-even price of $48.38.
- The Shopify skirt's stage budgets add up to its 84.7 total minutes.

## Stop and check

1. Sewing, "Time from price", $85, Shopify online, $32 materials, $5 overhead, $20 wage, 20% margin. The total is 84.7 minutes. The stage budgets for Cut, Sew, Fit, and Finish are 16.9, 38.1, 12.7, and 16.9, each with its icon. The aim-for times are 14.7, 33.1, 11.0, and 14.7.
2. Switch the preset to Etsy. The total is 67.4 minutes.
3. Switch to "Price from time" with 360 minutes and Shopify online. The price is $204.02. With Etsy it is $223.33.
4. Pie, "Time from price", $32, cash, $14 materials, $3 overhead. The total is 25.8 minutes, split 7.7, 6.5, 5.2, 2.6, and 3.9.
5. Sewing, Shopify online, $30 price, $32 materials, $5 overhead. The short message shows a $48.38 break-even price.
6. Type `abc` as the price. The field shows the alert icon and "Use a number, like 85.00", and nothing else breaks.
7. At 320px wide, the stage table stacks into label and value pairs with no sideways scroll.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] The owner confirmed every item in "Stop and check".
