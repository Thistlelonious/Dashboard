The full-page image behind everything, one per theme.

Place `<div class="sas-backdrop" data-layer="back"></div>` as the first child of `<body>`. It is fixed, covers the viewport and swaps its image when the theme changes.

- The consumer provides the images with `SewAndSo.setBackdrops({ light, colorful, dark })` or the `--sas-backdrop-<theme>` custom properties. Until then it shows the placeholder thread art.
- Never put text directly on the backdrop. Put it in a `sas-panel`, card, tile or app bar.
- Keep `data-layer="back"`. The layout tests use it to know the layer is meant to sit behind content.
