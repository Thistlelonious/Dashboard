Rows of figures, such as materials and costs, on a panel.

Use `<table class="sas-table">` inside an `sas-panel`, with a `thead`, a `tbody` and an optional `tfoot` for totals.

- The consumer provides the rows and a `data-label` on every cell, matching its column heading.
- Add `sas-table__num` to number cells and their headings. Figures right-align and use tabular digits so columns line up.
- Rows are separated by space, never rule lines.
- Under 600px wide the headings hide and each row stacks into label and value pairs. The first cell becomes the row's bold name.
