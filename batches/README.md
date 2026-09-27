# Batches

Build these in the order of this table with `/build-batch <n>`. The SewAndSo batch is `/build-batch bs`, and the design batch is `/build-batch bd`. Each batch ends at a "Stop and check" list. Claude stops there and waits for you to look at the work. After you confirm, Claude marks the batch "Done" in this table and merges it into `main`.

| Batch | File | Status | What you check |
|---|---|---|---|
| 1 | `b1-html-skeleton.md` | Not started | Every screen opens from the menu, and the back button and reload work. |
| bs | `bs-sewandso-additions.md` | Built, waiting for your check | SewAndSo shows its new icons, Table, print rules, and the Cut, Sew, Fit, Finish track. |
| bd | `bd-design.md` | Not started | Home and every screen use SewAndSo in all three themes and match its Workroom. |
| 2 | `b2-pricing-core.md` | Not started | The calculator gives the worked-example minutes and prices. |
| 3 | `b3-projects-and-setup.md` | Not started | Projects, settings, and the checklist survive a reload. |
| 4 | `b4-backup-merge.md` | Not started | A backup merges into a second browser, and the newer edit wins. |
| 5 | `b5-install-and-deploy.md` | Not started | The GitHub Pages address installs on your phone and works offline. |
| 6 | `b6-inventory-ledger.md` | Not started | Purchases and adjustments give the right stock and average cost. |
| 7 | `b7-receipt-import.md` | Not started | A receipt imports with exact landed costs, and a second import changes nothing. |
| 8 | `b8-project-materials.md` | Not started | Projects draw from stock, and "Mark built" uses it up. |
| 9 | `b9-documents.md` | Not started | The estimate, invoice, and cost sheet print with the worked-example figures. |
| 10 | `b10-invoice-history.md` | Not started | History filters, quarter totals, and the CSV export. |
| 11 | `b11-template-import.md` | Not started | A pattern template sets a project's stages. |
| 12 | `b12-build-timers.md` | Not started | Stage timers survive a reload and teach the stage weights. |
| 13 | `b13-pattern-library.md` | Not started | A pattern PDF opens at the right page beside its stage. |

## The design batch

SewAndSo is the design system, at `../SewAndSo/project/`. Batch `bs` adds what coinvoice needs to SewAndSo itself. The design batch `bd` then syncs it into the app and applies it to the screens batch 1 built. Every batch after it builds with SewAndSo and must pass `npm run check:design`. When SewAndSo changes, run `npm run sync:design` and check the screens again.

## Two copies of your data

Before batch 5, the app runs only at `localhost` on your laptop. From batch 5 on, it also runs at the GitHub Pages address. Browsers keep separate data for each address, so keep your real records at the GitHub Pages address.
