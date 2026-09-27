---
name: verify
description: Drive coinvoice, the Vite and React web app in this repo, in a real Chromium the way the owner does, and capture screenshots and ARIA snapshots as proof. Use after any UI or storage change, when a batch's "Stop and check" list needs walking, or when asked to run, check, or screenshot the app.
---

# Verify coinvoice

coinvoice is a single-page web app. Every screen hangs off a hash route under `/coinvoice/`, such as `#/`, `#/price/<projectId>`, or `#/setup`. All data lives in the browser's IndexedDB. There is no server, account, or API.

The driver `drive.mjs` opens a fresh Chromium profile for each run. Each run therefore starts with an empty database, the seeded checklist, and "No backup yet". It never touches the owner's records, which live at the GitHub Pages address.

## Launch

Start a dev server on port 5199, which is reserved for verification so it never collides with the owner's `npm run dev` on 5173. Run the Vite binary directly, so the saved PID is the process that owns the port.

```sh
mkdir -p .verify
node_modules/.bin/vite --port 5199 --strictPort > .verify/vite.log 2>&1 &
echo $! > .verify/vite.pid
until curl -sf -o /dev/null http://localhost:5199/coinvoice/; do sleep 0.5; done
```

It is ready when `http://localhost:5199/coinvoice/` answers 200. If `--strictPort` fails because 5199 is taken, check `lsof -nP -iTCP:5199 -sTCP:LISTEN`. Stop the process only if `.verify/vite.pid` names it. Otherwise report the port as occupied and stop.

For the installable build and offline behavior, drive the built site instead. `npm run build && node_modules/.bin/vite preview --port 5198 --strictPort` serves it at `http://localhost:5198/coinvoice/`. Pass `--url http://localhost:5198/coinvoice/` to the driver.

In a cloud container, set these before driving. Playwright's pinned Chromium isn't installed there, and Chromium must trust the egress proxy's CA to load Figtree from Google Fonts.

```sh
export VERIFY_CHROMIUM_PATH=/opt/pw-browsers/chromium
export VERIFY_BROWSER_ARGS="--ignore-certificate-errors-spki-list=$(openssl x509 -in /root/.ccr/agent-proxy-ca.crt -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64)"
```

## Doctor

```sh
node .claude/skills/verify/drive.mjs --doctor
```

It prints the URL, the page title (`coinvoice`), the first heading (`Home`), whether SewAndSo loaded, and whether Figtree loaded, then exits 0 only if all four hold. Run it first, and again whenever a recipe fails in a way that looks environmental. A false `figtree` means the browser can't reach Google Fonts, so layout proof from that run is not trustworthy.

## Drive

Write a recipe module whose default export receives `{ page, context, open, shot, evidence }`, then run it.

```sh
node .claude/skills/verify/drive.mjs <recipe.mjs> [--width 360|1280] [--theme light|colorful|dark] [--url <app url>]
```

- `open(hash)` loads a route such as `"#/setup"`, waits for the `h1`, and applies the chosen SewAndSo theme.
- `shot(name)` saves a full-page screenshot and an ARIA snapshot.
- `page` and `context` are Playwright objects. Use `expect` from `@playwright/test` for assertions.
- `evidence` is the run's evidence folder, for saved downloads.

Ready-made recipes live in `recipes/`. `recipes/projects.mjs` creates a project and proves it survives a reload. `recipes/backup.mjs` sends a backup and merges it back. Copy one as a starting point, and keep one-off recipes in `.verify/`, not in the repo.

Use roles and accessible names. The app is built from SewAndSo's `sas-` classes, and these handles are stable.

- A text field is `label.sas-field` filtered by its `.sas-field__label` text, with the `input` inside it. `tests/screen.ts` has `field()` and `fill()` helpers that show the pattern.
- Choice rows such as the craft, fee preset, and hue are radios. Pick one with `getByRole("radio", { name, exact: true })`.
- A project card is `getByRole("link", { name: "<project name>", exact: true })`, and its stage track is `ol.sas-stages > li.sas-stage`.
- The backup banner is `aside.sas-panel`.
- Screen titles are the only `h1`.

Check layout at 360px and 1280px wide, in all three themes. For a whole-app layout sweep, `npm run check:design` runs SewAndSo's layout checker on every screen. It needs `../SewAndSo` to be a checkout of the `sewandso` branch.

## Evidence

Each run writes to `.verify/evidence/<recipe>-<timestamp>/`, which git ignores. It holds numbered PNG screenshots, matching `.aria.yml` snapshots, and any files the recipe saved. The driver prints each path and ends with `OK` or `FAILED`. On an uncaught error it saves a `failure` shot and prints the page errors it saw.

A proof drives the real path a person takes: the buttons, fields, file pickers, and downloads. Never write to IndexedDB or call app modules directly. Capture the action and the resulting state. For anything saved, reload or reopen the page and show it again, because a value on screen is not proof it was stored.

## Cleanup

```sh
kill "$(cat .verify/vite.pid)" && rm .verify/vite.pid
```

Stop only the server this run started, by its saved PID. Never kill by process name, because the owner may have their own dev server running. Leave `.verify/evidence/` in place. It is the proof.

## Feature map

`features/README.md` indexes the user-facing features and how to prove each one. Read the matching file before driving a feature, and update the map when a batch adds or changes one. `/maintain-verification-skill` keeps it honest.
