A project's stages as a threaded row of icons.

An `<ol class="sas-stages">` of two to six `sas-stage` items. Each item holds an `sas-stage__node` with one SewAndSo icon and, except the last, an `sas-stage__thread`. The page decides the stages.

- Sewing defaults to Cut (scissors), Sew (needle), Fit (tape) and Finish (hanger). A project with no fittings, like a bag, drops Fit. Pressing belongs to Sew and Finish, because sewists press each seam as they go.
- The consumer sets `data-state="done"` or `data-state="now"` on each stage and gives every node an `aria-label` such as "Sew, in progress".
- With five or six stages, nodes shrink on phones under 400px wide so the row still fits.
- Done stages are filled with the hue and joined by solid thread. The current stage is ringed and larger. Stages not started are dashed like basting.
- Add `sas-stages--lg` in a hero.
