# coinvoice verification map

This folder is the maintained source for proving coinvoice's user-facing behavior. Read this index first, then use the matching feature file as the recipe.

## Baseline preconditions

- A dev server started by this run answers at `http://localhost:5199/coinvoice/`, as `../SKILL.md` "Launch" describes.
- `node .claude/skills/verify/drive.mjs --doctor` exits 0.
- Every driver run starts with a fresh browser profile. It has no projects, four seeded checklist items, default settings, and no backup sent.

## Driving conventions

- Prefer roles and accessible names. Fall back to the SewAndSo handles listed in `../SKILL.md` "Drive".
- Reload the page to prove anything saved. Saves run in the background as you type, so wait for the visible result before reloading.
- Check layout at 360px and 1280px wide, in the light, colorful, and dark themes.

## Proof and skip reporting

- Capture the action and the resulting state with `shot()`, not only the final screen.
- Name the feature file and entry point with each piece of evidence.
- If an entry point can't be reached, report the attempted step and the unmet precondition. Don't report it as proven through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph about the user-visible behavior. It then has these four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with drive.mjs`, and `Gotchas`.

## Features

- [Projects](./projects.md) covers creating projects on Home, their cards, and opening one.
- [Price](./price.md) covers the calculator, stage times, the reverse price, and removing Fit.
- [Setup](./setup.md) covers settings and the checklist.
- [Backup](./backup.md) covers sending a backup, merging one, the banner, and storage status.
- [Install and offline](./install-offline.md) covers the built site's manifest, service worker, and offline use.
