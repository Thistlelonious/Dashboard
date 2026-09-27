The four sewing stages as a threaded row of icons.

An `<ol class="sas-stages">` of four `sas-stage` items: scissors, needle, iron and hanger. Each item holds an `sas-stage__node` and, except the last, an `sas-stage__thread`.

- The consumer sets `data-state="done"` or `data-state="now"` on each stage and gives every node an `aria-label` such as "Sew, in progress".
- Done stages are filled with the hue and joined by solid thread. The current stage is ringed and larger. Stages not started are dashed like basting.
- Add `sas-stages--lg` in a hero.
