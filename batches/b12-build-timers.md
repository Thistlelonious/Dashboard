# b12. Build timers

**Goal.** Stage timers record actual time and teach the stage weights.

**Depends on.** b11.

**New dependencies.** None.

## Build

1. Build the Build screen at `#/build/<projectId>`. Link to it from the Price screen.
   - For sewing, a large StageTrack (`sas-stages--lg`) leads the screen. Stages with logged time and a stopped timer are "done", the running stage is "now", and the rest are "todo". Pies show their plain stage list.
   - It lists each stage with its budget minutes and the minutes used so far.
   - Each stage has "Start" and "Stop". Only one timer runs at a time, so starting a stage stops the running one.
   - A running timer is a time log with no `end`, so a reload keeps it running.
   - A "First build" checkbox sets `firstBuild`.
   - Each stage lists its template steps with the reference, page, and note.
2. When a project has time logs, its actual minutes are their sum. The manual "Actual minutes" field stays for projects without logs.
3. Write `learnedWeights(projects, domainId)` as a pure function. It uses built projects of that domain where `firstBuild` is false and that have time logs. It averages each stage's share of the time. It returns nothing until there are at least two such builds.
4. New projects of a domain start with the learned weights when they exist. The Price screen then says "Stage weights from your last N builds".

## Tests

- `learnedWeights` averages two builds and returns nothing for one build.
- A running log counts up to the current time.
- Actual minutes equal the sum of the logs.

## Stop and check

1. On your phone, open "Lined skirt" in build mode. Start "Cut", wait a minute, and reload. The timer is still running, and the scissors node on the stage track is ringed as the current stage.
2. Stop it. About one minute shows as used.
3. Start one stage, then another. The first one stops.
4. Log two short builds on two projects with "First build" unchecked, then mark both built. Create a new sewing project. Its weights come from those builds, and the Price screen says so.

## Done when

- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run check:design` pass.
- [ ] `npm run deploy` published the batch.
- [ ] The owner confirmed every item in "Stop and check".
