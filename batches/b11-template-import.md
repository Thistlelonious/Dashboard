# b11. Template import

**Goal.** Pattern templates from `/convert-pattern` set a project's stages and pattern cost.

**Depends on.** b10.

**New dependencies.** None.

## Build

1. Raise the database to version 4 with the store `templates`.
2. Write `src/imports/template.ts`. Its `zod` schema matches `PLAN.md` "Pattern templates". Stage names must be non-empty, and weights must be above zero.
3. Add "Apply template" to the Price screen's Project section. You can pick a file, which is saved as a template, or pick a saved template.
   - Applying sets the project's stages and `templateId`.
   - It adds a fixed "Pattern share" line of the pattern cost divided by `buildsToSpreadCost`, rounded half up.
   - It shows the license status as "License not checked", "License allows selling", or "License forbids selling".
4. Add `src/imports/fixtures/template-example.json`, a made-up pattern with the four sewing stages and a few step references. Never base it on a real pattern.
5. A template's stage names must come from its domain's stage names. The schema rejects any other name. A sewing template may leave out Fit, as a bag pattern would.

## Tests

- `src/imports/template.test.ts` accepts the fixture and rejects a template with a zero weight or no stages.
- Applying the fixture sets the stages and adds the pattern share line.

## Stop and check

1. Create a sewing project and apply the fixture. The stages and weights come from the file, the stage split follows them, a "Pattern share" line appears, and the license reads "License not checked".
2. Apply a copy of the fixture with its stages removed. A clear error shows, and the project stays as it was.
3. In the CLI, run `/convert-pattern ../Files/Patterns/<file>.pdf` on a real pattern. Apply the template it writes.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
