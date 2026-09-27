# bd. SewAndSo design

**Goal.** Every existing screen uses SewAndSo, and tooling keeps coinvoice in step with it.

**Depends on.** b1 and bs. This batch runs before b2.

**New dependencies.** `@playwright/test`, with Chromium only.

## Before you start

1. Read `../SewAndSo/project/README.md`, every `../SewAndSo/project/components/*/README.md`, `components/index.d.ts`, and `components/Workroom/preview.html`.
2. Compare `README.md`, `tokens.json`, `components/bundle.css`, `components/bundle.js`, and `components/index.d.ts` in `../SewAndSo/project/` with the published copy at https://claude.ai/artifact/AGqL9iknc5rdBhzmnT975V. Read each one with the Artifact tool's `read` action and its `project/...` path. If any file differs, stop and ask the owner which copy is current.

## Build

1. Write `scripts/sync-sewandso.mjs` and the script `sync:design`. It copies `bundle.css`, `bundle.js`, and `index.d.ts` from `../SewAndSo/project/components/` into `src/design/sewandso/`. It writes `tokens.css` there with `tokensToCss` from `../SewAndSo/scripts/tokens-to-css.mjs`. It writes `SOURCE.md` with each file's sha256 and the sync date. Run it and commit the copy.
2. In `src/main.tsx`, load `tokens.css`, `bundle.css`, `bundle.js`, and then `src/design/local.css`. Include `index.d.ts` through `tsconfig.json`, so `window.SewAndSo` is typed. Call `SewAndSo.restoreTheme()` once on start.
3. Write `src/design/Icon.tsx`. It renders the output of `SewAndSo.icon(name, opts)`. `local.css` gives its wrapper `display: contents`, so the SVG lays out as if it were placed directly. After each route change, call `SewAndSo.hydrate()` on the app root so radio groups get their keyboard order.
4. Build the app frame from SewAndSo components.
   - A Backdrop is the first child of `<body>`.
   - A `sas-page` wraps the content.
   - An AppBar holds the brand, which is the spool icon and "coinvoice" linking to `#/`, and a ThemeSwitch in its end group.
   - Remove batch 1's plain menu. Home's tiles replace it, and the brand leads back to Home.
5. Build Home at `#/` from the Workroom layout. It has four Tiles in `sas-grid sas-grid--tiles`, each in its own hue: Price (tape, cornflower), Stock (spool, fern), Invoices (invoice, plum), and Setup (settings, marigold). Project cards and the new-project form come in batch 3.
6. On every other screen, the `<h1>` uses `sas-display`, and each section is a `sas-panel` with a `sas-title` `<h2>`.
7. Start `src/design/local.css` with the icon wrapper only. It holds only what SewAndSo cannot, and `PLAN.md` "Design gaps" lists each rule.
8. Write `tests/design.spec.ts` and the script `check:design`.
   - It uses Playwright with Chromium at three sizes: 320 by 640, Pixel 7, and 1440 by 900.
   - For every route in `PLAN.md` "Screens and routes", with sample ids, and each of the three themes set by `SewAndSo.setTheme(id, { remember: false })`, it injects `../SewAndSo/tests/checker.js` and runs it the way `../SewAndSo/tests/helpers.mjs` does. Any violation fails the test.
   - Playwright's `webServer` starts the dev server.

## Tests

- `npm run check:design` passes at all three sizes in all three themes.

## Stop and check

1. Open `http://localhost:5173/`. Home shows the thread backdrop, an app bar with the spool and "coinvoice", and four tiles, each in its own color with its icon.
2. Tap each theme disc. The page crossfades to Light, Colorful, and Dark. Reload. The chosen theme stays.
3. Each tile opens its screen, with the screen name in large type on a raised panel. The brand leads back to Home.
4. In device mode at 320px wide, the tiles sit two across, nothing scrolls sideways, and the app bar wraps instead of squeezing.
5. Tab through the page with the keyboard. Every control shows the 3px focus ring, and the arrow keys move between the theme discs.
6. Compare with SewAndSo's Workroom. Run `python -m http.server 4178 --directory ../SewAndSo/.local` and open `http://localhost:4178/Workroom.html`. The app bar, tiles, type, and backdrop match.
7. Claude shows the `npm run check:design` output with no violations.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] The owner confirmed every item in "Stop and check".
