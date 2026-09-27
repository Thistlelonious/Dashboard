---
name: build-batch
description: Build one coinvoice batch from batches/. Use for "/build-batch 3", "/build-batch bd", "start batch 2", or "build the next batch".
argument-hint: <batch number, or bd>
---

# Build a batch

Batch requested: $ARGUMENTS

1. Read `CLAUDE.md`, `PLAN.md`, and `batches/README.md`. If no batch was given, take the first batch in the table whose status is "Not started".
2. Confirm that every batch above it in the table is "Done". If one is not, stop and say which.
3. Read the batch file in full. Its scope is the whole job. Put anything outside it in your report as a follow-up.
4. From the design batch on, read `../SewAndSo/project/README.md` and the README of every SewAndSo component the batch touches before writing UI.
5. Work on a branch named after the batch, such as `b2` or `bd`. Commit there as often as you like.
6. Run `/poteto-mode` and follow its Feature playbook for that scope. Skip its pull request step, since this project merges batches into `main` directly.
7. Run the batch's tests, `npm run typecheck`, and `npm test`. From the design batch on, also run `npm run check:design`. Fix failures before going on.
8. Run `/deslop` and `/no-comments`. Put every new UI string through `unslop` and SewAndSo's content rules.
9. From batch 5 on, run `npm run deploy`.
10. Start `npm run dev`. If a browser tool is available, walk the batch's "Stop and check" list yourself and fix what fails.
11. Stop. Give the owner the local link, the GitHub Pages link from batch 5 on, and the "Stop and check" list. Wait for the owner's answer.
12. When the owner confirms, set the batch to "Done" in `batches/README.md` and record any spec change in `PLAN.md`. Merge the branch into `main` with the message `<batch>: <batch title>`, such as `b2: pricing core`. From batch 5 on, push `main`.
13. When a step needs the owner, such as creating a repo, stop and give the exact steps. Never enter credentials.

Report in a few sentences. Say what you built, how each "Done when" item was checked, and anything you deferred.
