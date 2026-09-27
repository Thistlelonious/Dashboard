# b5. Install and deploy

**Goal.** coinvoice lives at its GitHub Pages address and installs on your phone.

**Depends on.** b4.

**New dependencies.** `vite-plugin-pwa` and `gh-pages`.

## Owner steps

Give the owner these steps and wait. Never enter credentials.

1. On GitHub, create a private repo named `coinvoice-src`. Add it as `origin` and push `main`.
2. Create a public repo named `coinvoice`, and leave it empty.
3. After the first deploy, open the `coinvoice` repo's Settings, then Pages. Set the source to the `gh-pages` branch and its root folder.

## Build

1. Set Vite's `base` to `/coinvoice/`.
2. Set up `vite-plugin-pwa`.
   - The manifest has the name and short name `coinvoice`, `display: standalone`, and a start URL and scope of `./`.
   - `theme_color` and `background_color` are SewAndSo's Light `canvas` value, read from the synced `tokens.css`.
   - Write `scripts/icons.mjs`. It renders SewAndSo's spool icon in `on-primary` on a Light `primary` square, to 192px and 512px PNGs, with Playwright.
   - The service worker caches the built files and updates itself. It also caches the Figtree font from Google Fonts on first load, so text keeps its font offline.
3. Add the script `"deploy": "npm run build && gh-pages -d dist -r <coinvoice repo URL>"`.
4. Run `npm run deploy`.
5. After the owner confirms, run `/create-verification-skill` so later batches have a scripted driver.

## Tests

- `npm run build` passes, and `npm run preview` serves the manifest and the service worker.

## Stop and check

1. On the laptop, open `https://<username>.github.io/coinvoice/`. The app loads, and a reload on `#/stock` stays on Stock.
2. On your Samsung, open the address in Chrome or Samsung Internet. From the browser menu, add it to the home screen. The teal spool icon appears.
3. Open it from the icon. It shows no browser bars.
4. Create a project on the phone. Turn on airplane mode, close the app, and open it again. It opens in the same font and theme, and the project is still there.
5. On the phone, press "Send backup". Send the file to the laptop with Quick Share. On the laptop, open the GitHub Pages address and merge it. The phone's project appears.

Data at `localhost` is separate from data at the GitHub Pages address. Keep real records at the GitHub Pages address from now on.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] The site is live at the GitHub Pages address.
- [ ] The owner confirmed every item in "Stop and check".
