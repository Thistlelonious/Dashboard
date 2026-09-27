# Install and offline

The built site installs to a phone's home screen and works with no signal. Its manifest names the app and its spool icons, and its service worker caches the app files and the Figtree font.

## Sub-features

- `pwa-manifest` serves `manifest.webmanifest` with `display: standalone`, the Light canvas colors, and 192px and 512px icons.
- `pwa-controlled` has the service worker control the page on the first visit.
- `pwa-offline` reopens with no network, keeping its font, theme, and data.
- `pwa-hash-reload` keeps the current screen, such as `#/stock`, across a reload.

## How to get to it (user POV)

- Open `https://thistlelonious.github.io/coinvoice/` and add it to the home screen from the browser menu.
- Open it from the home screen icon.

## Driving it with drive.mjs

Preconditions:

- The built site is served by `vite preview` on 5198, as in `../SKILL.md` "Launch". Pass `--url http://localhost:5198/coinvoice/`.

- **Manifest.** `page.request.get(new URL("manifest.webmanifest", page.url()).href)` returns the name "coinvoice", and each icon URL returns `image/png`.
- **Controlled.** After `open("#/")`, poll `navigator.serviceWorker.controller !== null` until it is true, then poll until `caches.open("google-fonts")` holds at least one entry.
- **Offline.** Create a project, choose the "Dark" theme radio, call `context.setOffline(true)`, close the page, and open a new one at `#/`. The card is there, `html` has `data-theme="dark"`, and Figtree reports loaded.
- **Proof.** `tests/pwa.spec.ts` runs the same checks in `npm run check:design`.

## Gotchas

- The dev server has no service worker. Offline behavior needs the built site.
- The dev server and preview serve the app under `/coinvoice/`, not `/`.
- The home screen install and the missing browser bars need a real phone. Report them as owner checks.
