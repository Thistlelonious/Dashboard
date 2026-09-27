SewAndSo is the look of a sewing workroom. Graphics lead and words follow. The page is spacious, the text is large and plain, and color comes from thread rather than decoration.

## Principles

1. **Show it, then say it.** Pick an icon, a color block or a stage graphic before writing a sentence. A label is one or two words.
2. **One text color per ground.** Text is `ink` on `canvas`, `surface`, `surface-sunk` and every `tint-*`. On a hue fill it is that hue's `on-*` token. There is no muted, faded or grey text.
3. **Nothing small.** The smallest text is the `label` style at 17px. Reading text is `body` at 18px. There are no captions, footnotes, eyebrows or badges.
4. **No underlines and no inline color.** Never underline text, and never color a word inside a sentence to make it stand out. To make something stand out, give it its own element: a button, a tile or a heading.
5. **Room to breathe.** Panels use `space-8` padding and grids use `space-8` gaps from tablet width up. When in doubt, add space instead of a divider.
6. **Motion only for change.** Things move only when the page changes state. A theme switch crossfades, a pressed button dips and a chosen swatch shows its check. Nothing loops, bounces or plays on load.

## Content

- Write short verbs and nouns in sentence case: "Keep sewing", "New project", "Fabric length".
- Name projects the way the maker does ("Skirt", "Messenger bag"). Never add filler such as "Welcome back!" or "Let's get started".
- A message says what to do in plain words: "Use a number, like 2.5". No codes, no blame.
- No emoji. Icons come from the SewAndSo icon set.

## Color

The palette is a thread box of seven hues: `rose`, `madder`, `marigold`, `fern`, `teal`, `cornflower` and `plum`. Every hue has three tokens that work together.

| token | use |
| --- | --- |
| `<hue>` | solid fills: buttons, tile art, swatches, finished stages |
| `on-<hue>` | text and icons on that fill |
| `tint-<hue>` | soft grounds for tiles, card art and tonal buttons, with `ink` text |

Set a hue on any component with `data-hue="plum"`. Children inherit it, so a button inside a plum card is plum. Without `data-hue`, components use `primary`.

The three themes share token names and change their values.

- **Light** is warm linen. `canvas` is oat, `surface` is paper white and `primary` is `teal`.
- **Colorful** is a sunny studio. `canvas` is peach, the tints are saturated, `primary` is `rose`, and card and hero art fill with the full hue.
- **Dark** is a night workroom. `canvas` is aubergine black, the hues glow, and `primary` is `marigold` with dark `on-*` ink.

`danger` (madder) and `success` (teal) never carry meaning alone. An error adds the `alert` icon and a message. A finished stage is filled and solid-threaded. Every text pair meets WCAG 4.5:1 in all three themes, and `line`, `focus` and every hue meet 3:1 on `surface`.

## Type

One family, Figtree, loaded from Google Fonts by `bundle.css`. It is a clean geometric sans that stays legible at every size. The fallback stack is Segoe UI, system-ui and Helvetica Neue.

| style | size / line | weight | use |
| --- | --- | --- | --- |
| `display` | 56 / 60 (40 / 44 on phones) | 800 | one per page: the project or screen name |
| `title` | 36 / 44 (30 / 36 on phones) | 700 | panel titles |
| `heading` | 26 / 32 | 700 | card titles |
| `subheading` | 21 / 28 | 600 | tile labels |
| `body` | 18 / 28 | 400 | running text |
| `label` | 17 / 24 | 600 | buttons, field labels, units, messages |

## Space, shape and depth

- Page gutters are `space-4` on phones, `space-8` on tablets and `space-12` on desktop. Content stops at `content-max` (1200px).
- Corners are soft. Use `radius-lg` for panels, cards and tiles, `radius-md` for art blocks, `radius-sm` for inputs and `radius-pill` for buttons and swatches.
- Anything you can press is at least `target` (48px) in both directions.
- Panels, cards and tiles lift off the backdrop with `shadow-raise`. There are no borders on containers and no colored side stripes.
- The keyboard focus ring is a solid 3px `focus` outline with a 3px offset.

## Backdrops

Each theme has its own full-page backdrop image under the `Backdrop` component. Text never sits on the backdrop. Everything readable lives on a `surface` panel, card or tile above it.

The shipped backdrops are placeholder thread art in each theme's palette. To use your own images, upload them and call `SewAndSo.setBackdrops({ light, colorful, dark })` with their URLs, or set `--sas-backdrop-light`, `--sas-backdrop-colorful` and `--sas-backdrop-dark` in CSS.

## Motion

| moment | effect |
| --- | --- |
| theme switch | whole-page crossfade, 320ms, `cubic-bezier(.2,.7,.2,1)` (View Transitions where supported) |
| button press | scale to 0.97, 160ms |
| tile or card hover (mouse only) | lift 3px, 160ms |
| swatch chosen | check fades and scales in, 160ms |

With `prefers-reduced-motion`, every transition is removed.

## Iconography

Twenty-five line icons on a 24px grid with a 1.75 stroke and round caps and joins.

- **Sewing:** needle, spool, scissors, pattern, tape, pin, button, fabric, iron and hanger.
- **Actions:** plus, check, close, delete, send, print, import, arrow-left and arrow-right.
- **Places and states:** home, camera, timer, settings, invoice and alert.

In markup, write `<svg data-sas-icon="needle"></svg>` and `SewAndSo.hydrate()` fills it. The icon takes its color from the text around it.

A stage track shows two to six stages, each drawn with a SewAndSo icon. Sewing defaults to Cut (scissors), Sew (needle), Fit (tape) and Finish (hanger). Pressing belongs to Sew and Finish, because sewists press each seam as they go.

## Tables

Figures go in a `sas-table` on a panel, in `body` text with tabular digits. Number cells right-align with `sas-table__num`. Rows are separated by `space-4`, not lines. Under 600px wide each row stacks into label and value pairs taken from each cell's `data-label`.

## Print

Printed pages use the Light values on white, whatever theme is on screen. `surface` and `canvas` become white, shadows drop, and text stays `ink`. The backdrop, app bar, theme switch and anything marked `data-print="hide"` are left off. Panels, cards and table rows don't split across pages.

## Using the system

Load the tokens CSS, `components/bundle.css` and `components/bundle.js`. Components are plain HTML with `sas-` classes, so no framework is needed. Call `SewAndSo.restoreTheme()` once on app start to bring back the maker's last theme.

## Layout tests

The source folder ships a Playwright suite that renders every component in all three themes on Chrome, Firefox and Safari, on desktop, tablet and phones down to 320px. It fails on overlapping elements, horizontal scrolling, text under 17px, underlined text, tap targets under 44px, text below contrast, or text sitting on the backdrop image. It also clicks through the theme switcher and reruns the checks after each switch, and it reruns them with the web font blocked.
