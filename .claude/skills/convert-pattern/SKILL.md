---
name: convert-pattern
description: Turn a purchased sewing pattern or pie recipe into a stage template the dashboard imports. Use for "/convert-pattern <path>", "convert this pattern", or "make a template from this recipe".
argument-hint: <path to a PDF or photo in ../Files/Patterns>
model: sonnet
---

# Convert a pattern

Source: $ARGUMENTS

A pattern is copyrighted. Read it in place and never copy it.

1. Read the source from `../Files/Patterns`. Never copy the file into this repo.
2. Pick the domain from the source, which is `sewing` or `pie`. Use exactly that domain's stage names from `src/pricing/domains/`, and never add a stage. If those files do not exist yet, use the stage table in `PLAN.md`. Sewing uses Cut, Sew, Fit, and Finish. Leave out Fit for a pattern with no fitting, such as a bag.
3. Map each numbered step to one stage. Record its step number, its page, and a note of six words or fewer in your own words. Never copy instruction text.
4. Start from the domain's default weights. Shift weight toward stages that hold more steps or harder techniques. List each weight you changed and the reason.
5. Set `licenseAllowsSelling` only when the pattern states its terms. Otherwise leave it `null`. Give the page of the terms, not their text.
6. For `cost`, look for a matching receipt in `../Files/Receipts-and-Sourcing`. If none matches, leave it `0` and say so.
7. Write `templates/<pattern-name>.json` in the shape shown in `PLAN.md`. If `src/imports/template.ts` exists, validate the file against its schema.

Report the file path and a table of stages with their weights and step counts. Then list anything for the owner to check.
