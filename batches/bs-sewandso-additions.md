# bs. SewAndSo additions

**Goal.** SewAndSo gains the icons, Table, print rules, and stage track change that coinvoice needs, and its published copy matches.

**Depends on.** Nothing in coinvoice. It must be done before `bd`.

**Works in.** `../SewAndSo/`. The only coinvoice file it changes is `batches/README.md`, to mark itself done.

## Before you start

1. If `../SewAndSo` has no git repo, run `git init` there and commit its current state as `SewAndSo before bs`. Its `.gitignore` already leaves out `node_modules/` and `.local/`.
2. Read `../SewAndSo/project/README.md`, `design/icons.mjs`, `design/build.mjs`, `design/component-docs.mjs`, and `scripts/build-local.mjs`. `design/build.mjs` writes `tokens.json`, the backdrop block of `bundle.css`, the icon block of `bundle.js`, and `design/out/`. `design/component-docs.mjs` writes the component READMEs. Edit those sources, never their output.
3. Compare `README.md`, `tokens.json`, `components/bundle.css`, `components/bundle.js`, and `components/index.d.ts` with the published copy at https://claude.ai/artifact/AGqL9iknc5rdBhzmnT975V, using the Artifact tool's `read` action. If any file differs, stop and ask the owner which copy is current.

## Build

1. **Icons.** Add `print`, `send`, `import`, `timer`, `settings`, `delete`, and `invoice` to `design/icons.mjs`. Draw them like the existing icons, as strokes only on the 24px grid with round caps and joins. Add them to `IconName` in `components/index.d.ts`, and list all 25 icons in the README's "Iconography" section.
2. **Stage track.** In `design/component-docs.mjs`, the StageTrack takes its stages from the page: two to six stages, each drawn with a SewAndSo icon. Sewing defaults to Cut (scissors), Sew (needle), Fit (tape), and Finish (hanger). Pressing belongs to Sew and Finish, because sewists press each seam as they go. Change the README's Iconography sentence to match. In the StageTrack, ProjectCard, and Workroom previews, replace Press and the iron with Fit and the tape.
3. **Table.** Add a Table component. Its styles go in `bundle.css`, outside the generated backdrop block. Its README goes in `design/component-docs.mjs`. Its preview is `components/Table/preview.html`, whose first line is a `@dsCard` marker like the other previews.
   - A table sits on a `sas-panel` with `body` text and tabular figures.
   - `sas-table__num` right-aligns numbers.
   - Rows are spaced with `space-4` and have no rule lines.
   - Under 600px wide, each row stacks into label and value pairs, taken from each cell's `data-label`.
   - The preview shows four fabric and notion rows with quantity, unit cost, and total.
4. **Print.** Add `@media print` rules to `bundle.css`. They use the Light token values on a white page and hide the backdrop, app bar, theme switch, shadows, and anything marked `data-print="hide"`. Add a "Print" section to the README.
5. Run `node design/build.mjs` and `node design/component-docs.mjs`, then `npm test` in `../SewAndSo`. Fix every violation. The Table must pass at 320px in all three themes. The layout tests need network access to load Figtree.
6. Publish to the claude.ai copy with the Artifact tool, following the instructions its `read` returns.
   - Upload the seven new SVGs from `design/out/icons/` as assets.
   - Send only the changed files under `project/`.
   - Send `project/design-system.json` last, with the new icon records and a `lastChange`. Its `by` is the owner's pseudonym, never a real name.
7. Compare the five files from "Before you start" again. They must match.
8. Commit in `../SewAndSo` as `bs: icons, table, print, stage track`.

## Stop and check

1. Open SewAndSo on claude.ai. The Icons group shows 25 icons. The seven new ones match the others in weight and style.
2. Run `python -m http.server 4178 --directory ../SewAndSo/.local` and open `http://localhost:4178/Table.html`. The table reads cleanly. Narrow the window to 320px. Each row stacks into labels and values, and nothing scrolls sideways.
3. Open `http://localhost:4178/Workroom.html`. The stage tracks show Cut, Sew, Fit, and Finish, with the tape for Fit.
4. In Workroom, switch to the Dark theme and open print preview. The page prints dark text on white, with no backdrop, app bar, or theme switch.
5. Claude shows `npm test` passing in `../SewAndSo` and the five files matching the published copy.

## Done when

- [ ] `npm test` passes in `../SewAndSo`.
- [ ] The published copy matches the local folder.
- [ ] The owner confirmed every item in "Stop and check".
