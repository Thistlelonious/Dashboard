# coinvoice spec

The design decisions were finalized on 2026-09-26. The implementation is split into batches in `batches/`. Build one at a time with `/build-batch <n>`.

coinvoice is a companion to the maker's invoices, which is where the name comes from (co-invoice). It answers one question for a sewing or pie project. Given a target sale price and a target profit margin, how many hands-on minutes can each stage take? It also answers the reverse. Given the minutes a build takes, what price reaches the margin? Around that core it keeps an inventory of purchased materials, prints customer and internal documents, and keeps an invoice history.

The visual design comes from SewAndSo, the owner's design system, at `../SewAndSo/project/` with a published copy at https://claude.ai/artifact/AGqL9iknc5rdBhzmnT975V. This spec covers behavior and data, plus the places where coinvoice needs something SewAndSo doesn't cover ("Design gaps").

## Decisions

| Topic | Choice | Reason |
|---|---|---|
| Labor and margin | Your wage is a cost. The margin is profit on top of it. | Only this setup gives a definite time budget per stage. |
| Hosting | GitHub Pages. The source repo `coinvoice-src` stays private. `npm run deploy` pushes the built site to the public repo `coinvoice`, which Pages serves. | Free, on an account you already have, and separate from any storefront. The code, notes, and receipt imports stay private. |
| Phone | An installable web app. Add it to the home screen from Chrome or Samsung Internet, and it opens full screen and works offline. | One codebase for phone and laptop. |
| Storage | IndexedDB on each device. Backup files carry data between devices and merge record by record. | No sign-in and no server. Patterns, prices, and invoices never leave your devices. Anyone else who opens the link sees an empty tool. |
| Sync | None. Backup files replace it. | Chosen on 2026-09-26. See "Alternatives considered". |
| Inventory | A ledger of purchases and uses. Stock on hand and average cost are computed from it. | Re-importing a receipt or fixing a typo recomputes everything. Nothing drifts. |
| Receipt intake | `/add-receipt` reads a receipt and asks you about unclear lines. It writes an import file, and the app does the cost math at import. | Claude reads. Code does the arithmetic, so the cents always add up. |
| Pattern intake | `/convert-pattern` reads a PDF in `../Files/Patterns` and writes a stage template. You check it and import it. | Free, no API key, and the pattern stays on your computer. |
| Documents | A customer estimate, a customer invoice, and an internal cost sheet. | The customer never sees your wage, margin, overhead, or fees. The cost sheet shows all of them. |
| Document numbers | Built from the creation date and time. | Two devices never need a shared counter. |
| Invoice history | Every estimate and invoice is kept, with its numbers frozen at invoicing. | Invoices are tax records. Later price changes must not rewrite them. |
| Sales channels | A Shopify storefront, in person, and direct. Etsy stays as a preset. | Sets the fee presets. coinvoice never connects to Shopify. |
| Setup checklist | A checklist panel, seeded with the business setup tasks. | Keeps the legal and account tasks in view. |
| Visual design | SewAndSo, synced into `src/design/sewandso/` and applied by the design batch `bd`. | One reference for every screen. Batch 1 builds plain HTML, and every batch after `bd` builds with SewAndSo. |
| Sewing stages | Cut, Sew, Fit, and Finish, shown as scissors, needle, tape, and hanger. A project without fittings drops Fit. | Pressing happens between seams, so it can't be timed as its own block. Fittings are long, separate sessions that made-to-measure work can't skip. See "Why these sewing stages". |

## Hosting and phone

The site lives on GitHub Pages at `https://<github-username>.github.io/coinvoice/`. The username appears in the address, so pick the account you want shown. Two repos hold the project:

- The private repo `coinvoice-src` holds this folder, which is the code, `CLAUDE.md`, `PLAN.md`, the batches, templates, and receipt imports.
- The public repo `coinvoice` holds only the built site. `npm run deploy` builds `dist/` and pushes it there with your own git login. Vite's `base` is `/coinvoice/`.

On your phone, open the address in Chrome or Samsung Internet and add it to the home screen. After that it has its own icon, opens without browser bars, and works with no signal. The app ships a web app manifest with `display: standalone` and a service worker that caches the app files.

### Moving data between devices

Each device keeps its own data in IndexedDB. Backup files carry it across.

1. **Send backup** writes every record to one JSON file named `coinvoice-backup-YYYY-MM-DD.json`. On a phone or tablet with a share sheet, it opens the sheet, so you can send the file with Quick Share, Drive, or email. A laptop downloads the file, because a laptop's share sheet has no way to save into a folder. Keep laptop copies in `../Files/Backups`.
2. **Merge backup** reads a backup file and shows how many records it would add, update, and leave unchanged. It writes only after you press "Merge". The record with the newer `updatedAt` wins, and a tie keeps this device's record. Deletes are soft (`deletedAt`), so a merge never brings back a deleted record. Merging the same file twice changes nothing the second time.
3. The Setup screen shows when you last sent a backup. A banner appears on every screen when no backup was ever sent or the last one is more than 14 days old, because invoices are tax records and a lost phone loses everything since its last backup. The banner links to Setup.
4. `lastBackupAt` belongs to the device that sent the backup. Sending a backup doesn't change the settings' `updatedAt`, so it can't make them win over a newer edit from another device. A merge never copies another device's `lastBackupAt`.
5. On every start, the app calls `navigator.storage.persist()` unless storage is already kept, so the browser does not clear its data to free space. Setup shows "Storage kept" or "Storage may be cleared".

A backup file is `{ app: "coinvoice", version: 1, exportedAt, stores }`. `stores` holds one array per database store with every record, deleted ones included. `zod` checks the whole file before anything changes. A file from another app, from a newer version, or with a broken record gets a plain error. A field this version doesn't know is kept, so a backup from a newer app loses nothing. A store added by a later batch needs a schema and a rule in `src/storage/backup.ts`. The compiler and a test that compares a backup against the database's stores both catch a store left out.

Pattern PDFs stay on the device where you add them. Backups leave them out.

Receipt imports happen on the laptop, where Claude runs. Send a backup to the phone afterward.

## Screens and routes

Routes use the URL hash, so a reload or a deep link works on GitHub Pages with no server rules.

| Route | Screen |
|---|---|
| `#/` | Home. Navigation tiles, project cards, and the new-project form, laid out like SewAndSo's Workroom. The default route. |
| `#/price` | Calculator with no project selected |
| `#/price/<projectId>` | Calculator with that project selected |
| `#/build/<projectId>` | Build mode with stage timers |
| `#/stock` | Inventory list |
| `#/stock/<itemId>` | One item with its purchase history |
| `#/invoices` | Invoice history |
| `#/invoices/<documentId>` | One document with its state moves |
| `#/print/<documentId>/<estimate or invoice or cost-sheet>` | Print view |
| `#/setup` | Settings, backup, and the setup checklist |

An unknown route shows Home.

## Pricing math

All amounts are per selling unit, which is one garment or one batch of pies. Money is integer cents. Sales tax is not part of the price. The estimate adds it on top.

```
fees          = round(price × feePct) + feeFixed
profit target = round(price × margin)
labor budget  = price − fees − materials − overhead − profit target
total minutes = labor budget ÷ wage × 60
stage budget  = total minutes × stage weight ÷ sum of weights
aim-for time  = stage budget ÷ (1 + allowance)
```

`round` is half up to the cent. The labor budget is what remains, so the lines of every document add up to the price exactly.

The formulas read each rate as a fraction. The code turns a rate into whole hundredths of a percent before it multiplies, so a half cent comes out as exactly half a cent. With plain fractions, $5.00 at 2.9% rounds to 14 cents instead of 15.

The reverse direction solves the same equation for price and rounds the result.

```
price = round((minutes ÷ 60 × wage + materials + overhead + feeFixed) ÷ (1 − feePct − margin))
```

If the labor budget is zero or less, the price cannot reach the margin even with no labor. The calculator says so and shows the break-even price, which is the reverse price at zero minutes.

Stage budget is the paid time. Aim-for time is the target while you work. The difference is the allowance for threading, setup, and interruptions. Garment factories use 10 to 20%.

Overhead includes the Shopify plan fee, divided by the units you expect to sell each month. The Basic plan is $39 a month, or $29 a month billed yearly.

### Fee presets

Shopify rates are for the Basic plan, from shopify.com/pricing.

| Preset | Percent | Fixed per order |
|---|---|---|
| Shopify online | 2.9% | $0.30 |
| Shopify in person | 2.6% | $0.10 |
| Etsy | 9.5% | $0.45 |
| Cash or direct | 0% | $0 |

The Etsy preset is the 6.5% transaction fee, 3% + $0.25 processing, and the $0.20 listing fee.

### Sales tax

The Whittier combined rate is 10.5% (CDTFA table for July to September 2026). Sewing is taxable. CDTFA taxes the full charge for making clothing, even when the customer supplies the fabric. Pies are exempt because cold bakery goods sold on their own are not taxed. The rate is a setting, since CDTFA can change it each quarter.

### Worked examples

These are unit tests. Each uses a $20/hr wage and a 20% margin.

| Case | Inputs | Result |
|---|---|---|
| Skirt on Shopify | $85 price, Shopify online fees, $32 materials, $5 overhead | Fees $2.77, labor budget $28.23, 84.7 minutes |
| Skirt on Shopify, reverse | 6 hours of labor, same costs | $204.02 price |
| Skirt on Etsy | $85 price, Etsy fees, $32 materials, $5 overhead | Fees $8.53, labor budget $22.47, 67.4 minutes |
| Skirt on Etsy, reverse | 6 hours of labor, same costs | $223.33 price |
| Apple pie, cash | $32 price, no fees, $14 ingredients and packaging, $3 overhead | Labor budget $8.60, 25.8 minutes |
| Skirt estimate | $85 price, $32 materials, 10.5% tax, 50% deposit | Sewing labor $53.00, tax $8.93, total $93.93, deposit $46.97, balance $46.96 |
| Pie estimate | $32 price, $14 ingredients and packaging, 50% deposit | Baking labor $18.00, no tax line, total $32.00, deposit $16.00, balance $16.00 |
| Skirt cost sheet | The Shopify skirt, 95 minutes logged | Actual labor $31.67, profit $13.56 (16.0%) against a $17.00 target, $28.57 per hour for labor and profit together |
| Receipt allocation | Lines $18.00 fabric (1.5 yd), $2.50 zipper, $3.00 personal. Tax $2.47. | Tax shares $1.89, $0.26, $0.32. Fabric lands at $19.89, or $13.26 per yard. Zipper lands at $2.76. The personal line is skipped. |
| Average cost | 1 yd lining at $6.00 on hand. Buy 2 yd for $15.00 landed. | 3 yd at $7.00 per yard. Using 1 yd costs $7.00 and leaves 2 yd at $7.00. |

The skirt estimate checks the rounding rule. Tax and deposit both land on half a cent and round up. The receipt allocation checks the largest-remainder rule in "Inventory".

## Inventory

Inventory is a ledger. A purchase adds stock at its landed cost. A use removes stock at the average cost at that moment. Stock on hand and average cost come from replaying the ledger in date order and are never stored.

- **Landed cost.** A receipt's tax, shipping, and discount are each shared across its lines in proportion to each line's total. Shares use the largest-remainder method, so they add up to the receipt amounts exactly. Skipped personal lines take their shares out with them.
- **Price history.** Each item lists its purchases with date, vendor, quantity, and landed unit cost.
- **Units.** Each item has one unit. Units convert within a family: length (yd, in, m, cm), weight (lb, oz, kg, g), volume (cup, tbsp, tsp, fl oz), and count (each). An item can hold one extra conversion across families, such as flour at 1 cup = 4.25 oz.
- **Projects.** A project's material line is a stock line (an item and a quantity), a planned purchase (a name and an estimated cost), or a fixed line (such as a pattern's cost shared across builds).
- **Stock use.** Marking a project "Built" records a use for each stock line and freezes those costs on the project. "Undo built" deletes those uses. An adjustment records waste or personal use.
- **Import.** A receipt import is keyed by its `receiptId`. Importing the same receipt again replaces its purchases, so it never doubles the stock. Before saving, the app shows each line as a new item, an addition to an existing item, or skipped. An existing item matches by name, ignoring case.

## Documents

Three print views share one layout. Each prints on one page and saves as a PDF.

| Document | Audience | Shows |
|---|---|---|
| Estimate | Customer | Business name, number, date, valid-until date (default 30 days), customer, item, materials line, labor line, subtotal, tax when taxable, total, deposit, balance |
| Invoice | Customer | The estimate's lines plus the invoice number, deposit paid, and balance due |
| Cost sheet | You only | Price, fees by preset, each material line with quantity and unit cost, overhead, labor budget and actual minutes at your wage, target and actual profit, actual margin, labor and profit per hour, sales tax collected |

The business name comes from Settings and starts empty. A customer document with no business name asks you to set one.

The materials line on customer documents is at cost and named by `estimateMaterialsLabel`. The labor line is named by `estimateLaborLabel` and equals the price minus materials, so fees, overhead, and profit stay inside it. The cost sheet's first line reads "Internal. Do not send." It is called a cost sheet, not an invoice, so nobody mails it by mistake.

### Lifecycle

A document moves through these states. The app offers only the moves in this table.

| From | To |
|---|---|
| Estimate | Invoiced, Void |
| Invoiced | Deposit paid, Paid, Void |
| Deposit paid | Paid, Void |
| Paid | None |
| Void | None |

Moving to "Invoiced" takes a snapshot of every money figure the three documents print. After that, a change to inventory costs, fees, or settings never changes the document. The cost sheet reads actual minutes from the project until the document is paid. Moving to "Paid" freezes the actual minutes into the snapshot.

### Numbers

A document number comes from its creation date and time, such as `EST-20260926-1432` for an estimate and `INV-20261002-0915` for an invoice. The invoice keeps its estimate's link. If a number is already taken on the device, the app adds `-2`, then `-3`.

### History

The history screen lists every document with its number, date, customer, item, total, and state. It filters by state and date range. It shows totals by quarter for sales before tax, sales tax collected, and profit, counting documents by the date they were invoiced. Estimates and void documents are left out of the totals. The list exports as CSV.

## Data model

Every saved record has an `id`, an `updatedAt` time, and an optional `deletedAt` time. Results, stock on hand, and average costs are computed and never saved.

```ts
type Cents = number
type Percent = number
type Saved = { id: string; updatedAt: string; deletedAt?: string }

type Domain = {
	id: "sewing" | "pie"
	label: string
	sellingUnit: string
	stages: StageTemplate[]
	allowancePct: Percent
	estimateMaterialsLabel: string
	estimateLaborLabel: string
	taxable: boolean
	complianceNotes: string[]
	cardIcon?: IconName
}

type Hue = "rose" | "madder" | "marigold" | "fern" | "teal" | "cornflower" | "plum"
type StageTemplate = { name: string; weight: number; waitMin: number; batchable: boolean; icon?: IconName; removable?: boolean }
type FeePreset = { name: string; pct: Percent; fixed: Cents }

type UnitFamily = "length" | "weight" | "volume" | "count"
type InventoryItem = Saved & { name: string; category: string; domain: Domain["id"]; unit: string; crossConversion?: { from: string; to: string; factor: number } }
type Purchase = Saved & { itemId: string; receiptId: string; date: string; vendor: string; qty: number; unit: string; landedCost: Cents }
type StockUse = Saved & { itemId: string; projectId?: string; date: string; qty: number; unit: string; reason: "build" | "adjustment" }

type MaterialLine =
	| { kind: "stock"; itemId: string; qty: number; unit: string; frozenCost?: Cents }
	| { kind: "planned"; name: string; qty: number; unit: string; unitCost: Cents }
	| { kind: "fixed"; name: string; cost: Cents }

type Project = Saved & {
	domain: Domain["id"]
	name: string
	hue: Hue
	templateId?: string
	price: Cents
	batchSize: number
	fee: FeePreset
	materials: MaterialLine[]
	overhead: Cents
	wage: Cents
	margin: Percent
	stages: StageTemplate[]
	firstBuild: boolean
	built: boolean
	actualMinutes?: number
	timeLogs: { stage: string; start: string; end?: string }[]
}

type DocState = "estimate" | "invoiced" | "deposit paid" | "paid" | "void"
type Document = Saved & {
	number: string
	estimateNumber?: string
	projectId: string
	customer: { name: string; contact?: string }
	itemDescription: string
	state: DocState
	stateLog: { state: DocState; at: string }[]
	snapshot?: DocumentSnapshot
}
type DocumentSnapshot = {
	price: Cents; fees: Cents; feePreset: string
	materials: { name: string; qty: number; unit: string; cost: Cents }[]
	overhead: Cents; wage: Cents; margin: Percent
	laborBudgetMinutes: number; actualMinutes?: number
	taxRate: Percent; tax: Cents; total: Cents; depositPct: Percent; deposit: Cents
}

type ChecklistItem = Saved & { text: string; why: string; done: boolean; seeded: boolean }
type Settings = { updatedAt: string; businessName: string; taxRate: Percent; depositPct: Percent; estimateValidDays: number; lastBackupAt?: string }
```

A `Percent` is in percent points with at most two decimals, so 2.9 means 2.9%. Fee percents, margins, tax rates, deposits, and allowances all use it.

`IconName` comes from SewAndSo's `index.d.ts`. A domain whose stages all have an `icon` shows SewAndSo's stage track. Sewing does, and pies show a plain stage list. A project's `hue` sets its card color and comes from a swatch picker when the project is created.

`firstBuild` keeps a learning build out of the learned stage weights. Wait minutes cover chilling, baking, and cooling. They are scheduled but never priced. For pies, a batchable stage's minutes cover the whole batch. Other stages also show minutes per pie. A time log with no `end` is a running timer.

## Code layout

Each folder owns one body of domain knowledge. Tests sit next to their module as `*.test.ts`.

```
src/
	main.tsx, App.tsx, routes.ts
	money.ts
	pricing/      fees.ts, pricing.ts, domains/sewing.ts, domains/pie.ts, domains/index.ts
	storage/      db.ts, records.ts, backup.ts, persistence.ts
	inventory/    units.ts, ledger.ts, allocate.ts
	documents/    lifecycle.ts, snapshot.ts, numbering.ts, history.ts
	imports/      receipt.ts, template.ts, fixtures/
	design/       sewandso/ (synced copy, never edited), local.css, Icon.tsx
	screens/      one folder per screen
scripts/        sync-sewandso.mjs, icons.mjs
tests/          design.spec.ts (SewAndSo layout checker)
```

## Domain files

Each domain is one data file. Adding bookbinding or woodburning later means writing a new file, not new code.

| Field | Sewing | Pie |
|---|---|---|
| `label` | Sewing | Pies |
| `sellingUnit` | garment | batch |
| `allowancePct` | 15 | 10 |
| `estimateMaterialsLabel` | Materials | Ingredients and packaging |
| `estimateLaborLabel` | Sewing labor | Baking labor |
| `taxable` | true | false |
| Stages and weights | Cut 20, Sew 45, Fit 15, Finish 20 | Crust 30, Filling 25, Assembly and crimping 20, Baking (hands-on) 10, Cooling and packaging 15 |
| Stage icons | scissors, needle, tape, hanger | None |
| Batchable stages | None | Crust, Filling, Baking (hands-on) |
| Removable stages | Fit | None |
| Wait minutes | 0 | 0 for now. Chill, bake, and cool times come later. |
| `cardIcon` | fabric | None |
| `complianceNotes` | Check each pattern's license before selling what you make from it. | Fruit pies are allowed under California cottage food law. Cream, custard, and meringue pies are not. |

The stage weights are starting guesses. Build-mode timers replace them with your own history.

- **Cut** covers pattern prep, layout, marking, and cutting.
- **Sew** covers construction, including pressing each seam.
- **Fit** covers fittings and the changes that follow them.
- **Finish** covers hems, closures, hand stitching, and the final press.

A project without fittings, such as a bag, removes Fit. Stage budgets divide by the sum of the remaining weights, so Cut, Sew, and Finish absorb its share. A stage marked `removable` can be taken out of a project and added back, and it returns to its place in the domain order.

### Why these sewing stages

SewAndSo first shipped Cut, Sew, Press, and Finish. coinvoice swaps Press for Fit, for these reasons.

- Sewists press each seam before sewing across it, so pressing is spread through construction. A Press timer would catch only the final press. Garment factories likewise put pressing in finishing.
- Custom dressmaking usually includes two fittings of about 90 minutes each, counting prep and the changes after. That is too much time to hide inside other stages, and made-to-measure is where the owner is headed.
- Pattern prep, such as printing and taping a PDF pattern, happens right before cutting, so it sits inside Cut. When a pattern is reused, the prep is not repeated, and the learned weights shrink Cut on their own.
- SewAndSo's stage track takes two to six stages, so a project without Fit shows three. Fit uses SewAndSo's `tape` icon.

## Design gaps

coinvoice needs these things that SewAndSo didn't cover when it first shipped. Batch `bs` adds them to SewAndSo itself, so coinvoice uses SewAndSo classes for all of them.

| Need | Added to SewAndSo by `bs` |
|---|---|
| Tables of numbers | A Table component on a `surface` panel, with `body` text, tabular figures, right-aligned numbers, and `space-4` row gaps with no rule lines. |
| Wide tables on phones | Under 600px wide, each Table row becomes a stacked block of label and value pairs, so nothing scrolls sideways at 320px. |
| Print | Print rules that use Light tokens on white, with no backdrop, shadows, or app bar. |
| Icons | `print`, `send`, `import`, `timer`, `settings`, `delete`, and `invoice`. The Setup tile uses `settings`, and the Invoices tile uses `invoice`. |
| Sewing stages | The stage track takes two to six stages from the page, and sewing defaults to Cut, Sew, Fit, and Finish. With five or six stages, the nodes shrink on phones so the row still fits at 320px. |

Pies stay outside SewAndSo's icon set. They show a plain stage list, and a pie project card shows its hue block with no icon.

`src/design/local.css` holds the rules SewAndSo can't cover. It uses only SewAndSo tokens.

| Rule | Why SewAndSo can't cover it |
|---|---|
| `.icon-slot { display: contents; }` | `Icon.tsx` puts the SVG from `SewAndSo.icon()` inside a React `<span>`. SewAndSo styles the SVG and knows nothing of that wrapper, so the wrapper drops out of layout. |
| `.check-item`, a two-column grid of a checkbox and its text, with the checkbox sized to `--target` and filled with `--primary` | SewAndSo has no checkbox. The Setup checklist needs one, so it uses a native checkbox at the tap-target size, and the text wraps beside it instead of dropping below it. |

## Setup checklist

The Setup screen shows a checklist. You can check items off and add your own. It starts with these seeded items:

| Item | Why |
|---|---|
| Get a California seller's permit from CDTFA. | Required before selling garments, which are taxable. |
| Register as a Class A cottage food operation with LA County Public Health, Environmental Health. | Required before selling pies. The 2026 sales cap is $88,878. |
| Confirm your Shopify plan and card rate in Shopify admin. | The fee presets assume the Basic plan. |
| Give fabric suppliers a California resale certificate (CDTFA-230). | With a seller's permit, materials that become part of items you sell can be bought without sales tax. That lowers the landed cost of fabric, thread, and zippers. |

## Import files

Claude writes import files. The app validates each one with `zod` before it changes anything, and shows a clear error for a broken file.

### Pattern templates

`/convert-pattern` writes `templates/<pattern-name>.json`. A template points at step numbers and pages. It never copies the pattern's instruction text.

```json
{
	"pattern": { "name": "", "designer": "", "cost": 0, "buildsToSpreadCost": 1, "licenseAllowsSelling": null },
	"domain": "sewing",
	"stages": [
		{ "name": "Construction", "weight": 50, "waitMin": 0, "batchable": false,
		  "steps": [ { "ref": "Step 4", "page": 7, "note": "insert invisible zipper" } ] }
	]
}
```

`licenseAllowsSelling` stays `null` until the pattern's terms are checked. `cost` is in cents.

### Receipts

`/add-receipt` writes `imports/receipts/<date>_<vendor>.json`. It records line totals only. The app computes landed costs at import.

```json
{
	"receiptId": "2026-09-20_joann_4471",
	"vendor": "JOANN",
	"date": "2026-09-20",
	"source": "../Files/Receipts-and-Sourcing/2026-09-20_joann_receipt.jpg",
	"subtotal": 2350, "discount": 0, "shipping": 0, "tax": 247, "total": 2597,
	"lines": [
		{ "raw": "LAWN NVY 1.5YD", "name": "Cotton lawn, navy", "category": "Fabric", "domain": "sewing",
		  "qty": 1.5, "unit": "yd", "lineTotal": 1800, "skip": false }
	]
}
```

All amounts are cents. The app rejects a file whose lines do not add up to the subtotal, or whose total is not subtotal minus discount plus shipping plus tax.

## Alternatives considered

On 2026-09-26 the owner chose backup files over sync. These options were weighed.

| Option | Outcome |
|---|---|
| Firebase (Firestore with Google sign-in) | The strongest sync option. Free with no card, and it syncs and works offline. Not chosen. |
| Google Drive app folder | The sync code would be ours to write, and Google makes a browser app ask for access again every hour. |
| Private GitHub repo as storage | Needs an access token typed on each device, and only the owner could use it. |
| Supabase | The free plan pauses after a week without use. |
| Cloudflare Pages | Works, but needs a second account. GitHub Pages does the job with the account you have. |

If sync comes back, the merge rules in "Moving data between devices" already match what it needs.

## Sources

- Shopify plans and rates: https://www.shopify.com/pricing
- Etsy fees: https://craftybase.com/blog/the-complete-guide-to-etsy-fees
- Whittier sales tax: https://www.salestaxhandbook.com/california/rates/whittier and https://cdtfa.ca.gov/taxes-and-fees/rates.aspx
- California tax on fabrication labor: https://cdtfa.ca.gov/formspubs/pub108/taxable-labor.htm
- California resale certificates: https://cdtfa.ca.gov/formspubs/pub103/valid-resale-certificates.htm
- LA County cottage food registration: http://publichealth.lacounty.gov/eh/business/class-a-cottage-food-operators.htm
- California cottage food limits: https://www.cottagefoodlicense.com/blog/california-cottage-food-law-2026-class-a-vs-class-b-complete-guide
- Sewing wages: https://www.payscale.com/research/US/Job=Seamstress/Hourly_Rate
- Pie prices and times: https://bakeprofit.com/blog/pricing/how-to-price-pies
- Pattern copyright: https://craftindustryalliance.org/personal-use-restrictive-clauses-craft-patterns/
- Garment allowances: https://www.onlineclothingstudy.com/2011/02/how-to-calculate-sam-of-garment.html
- Free hosting terms: https://ecn-apps.com/pages/articles/vercel-vs-netlify-vs-cloudflare-pages-2026.html
- Firebase free plan limits: https://firebase.google.com/docs/firestore/quotas
- Pressing as you sew: https://so-sew-easy.com/press-seams-sew/
- Pressing in garment finishing: https://garmentsdoctor.com/manufacturing-flowchart/
- Fittings in custom dressmaking: https://www.dressmaking.academy/post/how-much-to-charge-for-custom-dressmaking