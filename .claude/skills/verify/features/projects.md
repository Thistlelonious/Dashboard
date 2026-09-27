# Projects

Home lists every project as a card in its hue, and its "New project" form starts a sewing or pie project. A sewing card shows the Cut, Sew, Fit, Finish stage track. A pie card shows its plain hue block. A card opens that project on the Price screen.

## Sub-features

- `project-create` starts a project from a name, a craft, and a hue.
- `project-card` shows the card art and, for sewing, the stage track.
- `project-open` opens `#/price/<projectId>` from a card.
- `project-persist` keeps projects across a reload.

## How to get to it (user POV)

- Open Home at `#/`, or choose the "coinvoice" brand link in the app bar from any screen.
- Fill in "New project" and choose "Start project".

## Driving it with drive.mjs

Preconditions:

- The baseline state, with no projects.

- **Create.** `open("#/")`, fill the "Name" field, click the "Sewing" or "Pies" radio and a hue radio such as "Plum", then click the "Start project" button. The card link named after the project appears, and the "Name" field clears.
- **Card.** A sewing card has four `li.sas-stage` items. A pie card has none.
- **Open.** Click the card. The URL matches `#/price/<uuid>`, and the project name shows in a `.sas-heading`.
- **Proof.** `recipes/projects.mjs` runs all of this with a reload between creating and opening.

## Gotchas

- Card order is newest edit first, so an edit to one project moves its card to the front.
- An empty Home shows "Start one under New project." instead of cards.
