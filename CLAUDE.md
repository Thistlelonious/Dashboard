# coinvoice

coinvoice is a static web app for one maker, and its name comes from "co-invoice", a companion to the maker's invoices. It works out how many hands-on minutes each stage of a sewing or pie project can take to reach a target price and margin. It also keeps a materials inventory, prints estimates, invoices, and internal cost sheets, and keeps an invoice history. `PLAN.md` is the spec. Read it before any change.

## How to work here

- The pstack plugin is enabled in `.claude/settings.json`. Work in `/poteto-mode`. A reference copy of pstack is in `vendor/pstack/`.
- Build one batch at a time with `/build-batch <n>`. The batches are in `batches/`, and `batches/README.md` tracks their status.
- Turn a purchased pattern or recipe into a stage template with `/convert-pattern <path>`.
- Turn a store receipt into an inventory import with `/add-receipt <path>`.
- Run `/deslop` before each commit and `/no-comments` before review.
- Put every piece of prose through `unslop`. That includes UI labels, the documents, errors, docs, and commit messages.
- A spec change goes into `PLAN.md` in the same commit as the code.
- Commit to `main` after the owner confirms a batch. This project skips pull requests.

## Models

pstack's per-role models come from `~/.claude/pstack-models.md`, which `~/.claude/CLAUDE.md` loads in every session.

- Opus 5.5 is the default for the main session and every subagent.
- Sonnet 5 handles reading-heavy work, verification runs, and trivial edits. `/add-receipt` and `/convert-pattern` also run on it.
- Never use Fable 5.1 or Opus 5.

## Stack

- Vite, React, and TypeScript in strict mode. Vitest for tests.
- IndexedDB through `idb`. `fake-indexeddb` for storage tests. No server and no accounts.
- `zod` parses imported templates, receipts, and backup files at the import step. Internal data is trusted after that.
- `vite-plugin-pwa` for the manifest and the service worker.
- `@playwright/test` with Chromium runs SewAndSo's layout checker against coinvoice's screens, from the design batch on.
- `pdfjs-dist` for the pattern viewer, added in batch 13.
- GitHub Pages hosts the site from the public repo `coinvoice`. `npm run deploy` builds `dist` and pushes it there with `gh-pages`. Vite's `base` is `/coinvoice/`.
- Ask before you add any other dependency.

## Code rules

- The pricing formula lives in one pure module with no React, DOM, or storage imports. The worked examples in `PLAN.md` are its tests.
- Store money as integer cents. Round half up to the cent, and only at the steps `PLAN.md` names.
- Results, stock on hand, and average costs are computed on every render and never saved.
- Domains are data. A difference between sewing and pies goes in the domain file. Never branch on the domain id.
- Document states move only through the lifecycle table in `PLAN.md`. Encode it as a table, not scattered conditions.
- No `any`, no casts to silence the compiler, and no try/catch on trusted internal paths.
- A comment explains a non-obvious reason. Delete any comment that restates the code.

## Design

SewAndSo is the design system and the only reference for the UI.

- The source is `../SewAndSo/project/`. Read `README.md` first, then the `components/<Name>/README.md` of each component you use. `components/Workroom/preview.html` is the reference layout.
- A published copy lives at https://claude.ai/artifact/AGqL9iknc5rdBhzmnT975V. Read it with the Artifact tool when the local folder is missing.
- The app uses a synced copy in `src/design/sewandso/`. `npm run sync:design` refreshes it. Never edit the copy. Design changes happen in SewAndSo, then get synced.
- Build every screen from SewAndSo's `sas-` classes, tokens, and icons. Write no colors, fonts, sizes, or spacing by hand. A need SewAndSo doesn't cover goes in `src/design/local.css`, built only from SewAndSo tokens, and gets listed in `PLAN.md` "Design gaps".
- Follow SewAndSo's content rules for every label and message. They sit on top of `unslop`.
- Before the design batch (`bd`) is done, build plain semantic HTML with no styling.

## Commands

These exist once batch 1 sets up the project.

- `npm run dev` starts the dev server. `npm run dev -- --host` also serves it to your phone on the same Wi-Fi.
- `npm test` runs the unit tests.
- `npm run typecheck` runs the TypeScript compiler.
- `npm run build` builds `dist/`.
- `npm run sync:design` copies SewAndSo into `src/design/sewandso/`. It exists from the design batch.
- `npm run check:design` runs SewAndSo's layout checker on every screen in all three themes. It exists from the design batch.
- `npm run deploy` builds and publishes to GitHub Pages. It exists from batch 5.

## Verify

- A batch is done only when its "Done when" items pass and the owner confirms its "Stop and check" list.
- Check UI changes in the browser at 360px and 1280px wide, in all three SewAndSo themes. Check documents in print preview.
- From the design batch on, `npm run check:design` must pass before a batch stops for the owner.
- After batch 5, run `/create-verification-skill` so later batches have a scripted driver.

## Context

- The owner sells from Whittier, CA, and posts finished products on a Shopify storefront. coinvoice has no other tie to that store.
- Public content is pseudonymous. Never put a real name in the app or the repo files.
- Purchased patterns live in `../Files/Patterns`, outside this repo. Never copy a pattern file or its instruction text into this repo or the app.
- Receipts live in `../Files/Receipts-and-Sourcing`, and backups in `../Files/Backups`. Customer names and invoices exist only in the app's storage and in backups. Never commit a backup.
