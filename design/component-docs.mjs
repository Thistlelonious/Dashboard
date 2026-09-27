import { writeFileSync, mkdirSync } from 'node:fs';

const docs = {
  Backdrop: `The full-page image behind everything, one per theme.

Place \`<div class="sas-backdrop" data-layer="back"></div>\` as the first child of \`<body>\`. It is fixed, covers the viewport and swaps its image when the theme changes.

- The consumer provides the images with \`SewAndSo.setBackdrops({ light, colorful, dark })\` or the \`--sas-backdrop-<theme>\` custom properties. Until then it shows the placeholder thread art.
- Never put text directly on the backdrop. Put it in a \`sas-panel\`, card, tile or app bar.
- Keep \`data-layer="back"\`. The layout tests use it to know the layer is meant to sit behind content.`,

  AppBar: `The top bar: the SewAndSo name on the left, actions and the theme switch on the right.

Markup is a \`<header class="sas-appbar">\` holding an \`sas-appbar__brand\` link and an \`sas-appbar__end\` group.

- The consumer provides the brand link target and up to two icon buttons before the theme switch.
- The brand uses the \`spool\` icon in \`primary\` and the name in plain type. There is no logo file.
- On narrow phones the end group wraps onto a second row instead of shrinking anything.`,

  Button: `A pill-shaped action with an optional leading icon.

Use \`<button class="sas-button">\` or \`<a class="sas-button">\`. Variants are \`sas-button--tonal\`, \`sas-button--outline\` and \`sas-button--icon\`.

- The consumer provides a label of one to three words, an optional \`<svg data-sas-icon>\` before it, and \`data-hue\` for a hue other than \`primary\`.
- An icon-only button needs \`aria-label\`.
- Disabled buttons get a dashed "basting" border and keep full-contrast text.
- One filled button per panel. Use tonal or outline for the rest.`,

  ThemeSwitch: `Three palette discs that switch between Light, Colorful and Dark.

A \`role="radiogroup"\` of three \`sas-theme-switch__option\` buttons, each with \`data-sas-theme\` and an \`sas-theme-switch__disc\` carrying the same \`data-theme\`.

- Each disc paints its own theme's colors, so people choose by what they see, not by reading.
- The chosen disc gets an \`ink\` ring and grows slightly. Arrow keys move between discs.
- The consumer provides nothing else. \`bundle.js\` handles clicks, keyboard, \`aria-checked\` and remembering the choice.`,

  Tile: `A large navigation square: a hue block with an icon, and a one-word label.

Use \`<a class="sas-tile" data-hue="…">\` with an \`sas-tile__art\` holding a large icon and an \`sas-tile__label\`. Lay tiles out in \`sas-grid sas-grid--tiles\`.

- The consumer provides the destination, one icon, a one-word label and a hue.
- Give every tile in a grid a different hue.
- Tiles sit two across on phones and fill the row on wider screens.`,

  ProjectCard: `A project at a glance: art on top, then its name and stage track.

Use \`<article class="sas-card" data-hue="…">\` with an \`sas-card__art\` and an \`sas-card__body\` holding an \`sas-card__title\` and an \`sas-stages\` list.

- The consumer provides a photo (\`<img>\` inside the art) or one icon, the project name, the stage states and a hue.
- In Colorful the art fills with the full hue.
- No dates, counts or descriptions on the card. Open the project for detail.`,

  StageTrack: `The four sewing stages as a threaded row of icons.

An \`<ol class="sas-stages">\` of four \`sas-stage\` items: scissors, needle, iron and hanger. Each item holds an \`sas-stage__node\` and, except the last, an \`sas-stage__thread\`.

- The consumer sets \`data-state="done"\` or \`data-state="now"\` on each stage and gives every node an \`aria-label\` such as "Sew, in progress".
- Done stages are filled with the hue and joined by solid thread. The current stage is ringed and larger. Stages not started are dashed like basting.
- Add \`sas-stages--lg\` in a hero.`,

  Field: `A labeled text input with an optional unit and error message.

Use \`<label class="sas-field">\` with an \`sas-field__label\`, an \`sas-field__control\` holding the \`sas-field__input\` and an optional \`sas-field__unit\`, and an \`sas-field__message\`.

- The consumer provides the label, value, unit and message, and sets \`data-state="error"\` with \`aria-invalid\` and \`aria-describedby\` on the input.
- Errors show a thicker \`danger\` border, the \`alert\` icon and a plain message in \`ink\`, never color alone.
- Labels are always visible. Never use placeholder text as a label.`,

  Swatches: `A row of round color chips for picking a thread or fabric color.

A \`role="radiogroup"\` of \`sas-swatch\` buttons, each with \`role="radio"\`, \`data-hue\`, \`data-value\` and \`aria-label\`, and a \`check\` icon inside.

- The consumer provides the options and listens for the \`sas-change\` event, which carries \`detail.value\`.
- The chosen chip gets an \`ink\` ring and shows its check. Arrow keys move the choice.
- Label the group with a visible \`sas-field__label\` and \`aria-labelledby\`.`,

  Workroom: `A full showcase page that puts every component together over the Light, Colorful and Dark backdrops.

Use it as the reference layout. It has an app bar, a hero for the current project, navigation tiles, project cards and a new-project form. The layout tests click through its theme switch.`,
};

for (const [name, body] of Object.entries(docs)) {
  const dir = new URL(`../project/components/${name}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('README.md', dir), body + '\n');
}

const groups = {
  Icons: `The SewAndSo line icons: 24px grid, 1.75 stroke, round caps and joins. These files are drawn in Light \`ink\` (#231c17). In pages, use \`<svg data-sas-icon="name">\` so the icon takes the surrounding text color.`,
  Backgrounds: `Placeholder backdrop art, one per theme: light.svg, colorful.svg and dark.svg. Each is drawn from that theme's tokens. Replace them with your own images and pass the URLs to \`SewAndSo.setBackdrops\`.`,
};
for (const [name, body] of Object.entries(groups)) {
  const dir = new URL(`../project/assets/${name}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('README.md', dir), body + '\n');
}
console.log('docs written');
