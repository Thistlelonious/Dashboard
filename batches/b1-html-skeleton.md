# b1. HTML skeleton

**Goal.** A running app with every screen as plain HTML, and the tooling every later batch uses.

**Depends on.** Nothing.

**New dependencies.** `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`.

## Before you start

1. If `git config user.name` is empty, stop and ask the owner to set a pseudonymous name. Never set it yourself.
2. If the repo has no commits, commit the planning files on `main` as `b0: planning`.

## Build

1. Scaffold Vite with its React and TypeScript template in this folder. Keep every existing file. Name the package `coinvoice`. Turn on TypeScript `strict`.
2. Add these scripts: `dev`, `build`, `preview`, `test` (`vitest run`), and `typecheck` (`tsc --noEmit`).
3. Delete the template's demo content, CSS files, and logos.
4. In `index.html`, set `lang="en"`, the title `coinvoice`, and a `width=device-width, initial-scale=1` viewport.
5. Write `src/routes.ts`. It parses `location.hash` into a discriminated union that covers every route in `PLAN.md` "Screens and routes", with its ids and print kind. An unknown hash, or a print kind other than `estimate`, `invoice`, or `cost-sheet`, resolves to the home route.
6. Write `src/App.tsx`. It listens for `hashchange` and renders the screen for the current route. A plain `<nav>` links to Home, Price, Stock, Invoices, and Setup. The design batch replaces it.
7. Create one folder per screen in `src/screens/`. Each screen renders its `<h1>` and the empty `<h2>` sections below. Screens with an id show the id they received. Use no placeholder numbers and no fake data. Add no CSS. SewAndSo arrives in the design batch.

| Screen | Sections |
|---|---|
| Home | Projects, New project |
| Price | Project, Inputs, Time per stage |
| Build | Stages, Pattern |
| Stock | Items |
| Item | Purchases |
| Invoices | Documents, Quarter totals |
| Document | Details, Moves |
| Setup | Settings, Backup, Checklist |
| Print | The document kind |

## Tests

- `src/routes.test.ts` parses every route in the table with its ids.
- An unknown hash and `#/print/x/bogus` both resolve to the home route.

## Stop and check

1. Open `http://localhost:5173/`. The browser tab reads "coinvoice", and the Home screen shows.
2. Each menu link opens its screen, and the address changes to `#/stock` and so on.
3. The browser's back button returns to the previous screen.
4. Reload while on `#/stock`. The Stock screen stays.
5. Open `#/invoices/abc`. The document screen shows `abc`.
6. Open `#/nowhere`. The Home screen shows.
7. In the browser's device mode at 360px wide, no screen scrolls sideways.
8. Optional. Run `npm run dev -- --host` and open its Network address on your phone on the same Wi-Fi.

## Done when

- [ ] `npm run typecheck`, `npm test`, and `npm run build` pass.
- [ ] The owner confirmed every item in "Stop and check".
