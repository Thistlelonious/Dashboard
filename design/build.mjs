import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { themes, base, hues, primary, DARK, LIGHT } from './palette.mjs';
import { icons, svgFile } from './icons.mjs';
import { backdropSvg } from './backdrops.mjs';

const root = new URL('../project/', import.meta.url);
const out = new URL('./out/', import.meta.url);

const lum = h => {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const perTheme = arr => Object.fromEntries(themes.map((t, i) => [t, arr[i]]));
const onFor = fills => fills.map((f, i) => {
  const pick = contrast(LIGHT, f) >= 4.5 ? LIGHT : DARK[i];
  if (contrast(pick, f) < 4.5) throw new Error(`no legible ink on ${f}`);
  return pick;
});

const hueNotes = {
  rose: 'Rose thread. Warm accent for personal projects and the primary in Colorful.',
  madder: 'Madder red. Carries the danger state and warm project accents.',
  marigold: 'Marigold. Sunny accent; the primary in Dark.',
  fern: 'Fern green. Fabric and natural-fibre accents.',
  teal: 'Teal. The primary in Light and the success state in every theme.',
  cornflower: 'Cornflower blue. Measurement and planning accents.',
  plum: 'Plum. Deep accent for tailoring and formal work.',
};

const color = [
  { name: 'canvas', value: perTheme(base.canvas), usage: 'Page ground under the backdrop image. Never carries text directly; text sits on `surface`.' },
  { name: 'surface', value: perTheme(base.surface), usage: 'Panels, cards, app bar. The ground for `ink` body text.' },
  { name: 'surface-sunk', value: perTheme(base['surface-sunk']), usage: 'Inputs, wells and the idle stage nodes. Carries `ink` text.' },
  { name: 'line', value: perTheme(base.line), usage: 'Control borders and stitch lines on `surface` and `surface-sunk` (3:1 or better).' },
  { name: 'ink', value: perTheme(base.ink), usage: 'The only text color on `canvas`, `surface`, `surface-sunk` and every `tint-*`. There is no muted text.' },
  { name: 'focus', value: perTheme(base.focus), usage: 'The 3px keyboard focus ring. At least 3:1 on every surface.' },
];
for (const [h, v] of Object.entries(hues)) {
  color.push({ name: h, value: perTheme(v.fill), usage: `${hueNotes[h]} Solid fills: buttons, tile art, swatches, completed stitches. 3:1 or better on \`surface\`.` });
  color.push({ name: `on-${h}`, value: perTheme(onFor(v.fill)), usage: `Text and icons on \`${h}\`.` });
  color.push({ name: `tint-${h}`, value: perTheme(v.tint), usage: `Soft ${h} ground for tiles and card art. Carries \`ink\` text.` });
}
color.push(
  { name: 'primary', value: perTheme(primary.map(h => `{${h}}`)), usage: 'The main action color: Teal in Light, Rose in Colorful, Marigold in Dark.' },
  { name: 'on-primary', value: perTheme(primary.map(h => `{on-${h}}`)), usage: 'Text and icons on `primary`.' },
  { name: 'tint-primary', value: perTheme(primary.map(h => `{tint-${h}}`)), usage: 'Tonal buttons and selected grounds. Carries `ink` text.' },
  { name: 'danger', value: '{madder}', usage: 'Error borders and the error icon. Always paired with the `alert` icon and a message, never color alone.' },
  { name: 'success', value: '{teal}', usage: 'Completed stages. Teal sits off the red-green axis from `danger`, and done stages also carry the check shape.' },
);

const tokens = {
  name: 'SewAndSo',
  version: 1,
  color: {
    themes: [
      { id: 'light', name: 'Light' },
      { id: 'colorful', name: 'Colorful' },
      { id: 'dark', name: 'Dark' },
    ],
    tokens: color,
  },
  type: {
    fonts: [],
    families: { sans: '"Figtree", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif' },
    groups: [
      {
        name: 'Text',
        family: 'sans',
        styles: [
          { name: 'display', fontSize: '56px', lineHeight: '60px', fontWeight: 800, letterSpacing: '-0.02em', sample: 'Skirt', usage: 'One per page: the project or screen name. Drops to 40px under 600px wide.' },
          { name: 'title', fontSize: '36px', lineHeight: '44px', fontWeight: 700, letterSpacing: '-0.01em', sample: 'Messenger bag', usage: 'Panel titles. Drops to 30px under 600px wide.' },
          { name: 'heading', fontSize: '26px', lineHeight: '32px', fontWeight: 700, sample: 'Tailoring', usage: 'Card titles.' },
          { name: 'subheading', fontSize: '21px', lineHeight: '28px', fontWeight: 600, sample: 'Patterns', usage: 'Tile labels and the app bar name.' },
          { name: 'body', fontSize: '18px', lineHeight: '28px', fontWeight: 400, sample: 'Cut the lining on the fold.', usage: 'All running text. The floor for reading text.' },
          { name: 'label', fontSize: '17px', lineHeight: '24px', fontWeight: 600, sample: 'Keep sewing', usage: 'Buttons, field labels, units and messages. The smallest size in the system.' },
        ],
      },
    ],
  },
  spacing: {
    tokens: [
      { name: 'space-2', value: '8px', usage: 'Icon to label gap.' },
      { name: 'space-3', value: '12px', usage: 'Between a field label and its control.' },
      { name: 'space-4', value: '16px', usage: 'Page gutter on phones; gaps inside controls.' },
      { name: 'space-6', value: '24px', usage: 'Card padding on phones; grid gap on phones.' },
      { name: 'space-8', value: '32px', usage: 'Card and panel padding; grid gap from tablet up; page gutter on tablets.' },
      { name: 'space-12', value: '48px', usage: 'Page gutter on desktop; space between page sections.' },
      { name: 'space-16', value: '64px', usage: 'Hero panel padding on desktop.' },
    ],
  },
  radius: {
    tokens: [
      { name: 'radius-sm', value: '10px', usage: 'Inputs and small art.' },
      { name: 'radius-md', value: '18px', usage: 'Tile art, card art.' },
      { name: 'radius-lg', value: '28px', usage: 'Panels, cards, tiles.' },
      { name: 'radius-pill', value: '999px', usage: 'Buttons, swatches, theme discs.' },
    ],
  },
  shadow: {
    tokens: [
      {
        name: 'shadow-raise',
        value: {
          light: '0 1px 2px rgba(35, 28, 23, 0.06), 0 14px 36px rgba(35, 28, 23, 0.10)',
          colorful: '0 1px 2px rgba(43, 16, 48, 0.08), 0 14px 36px rgba(160, 40, 90, 0.16)',
          dark: '0 1px 2px rgba(0, 0, 0, 0.40), 0 16px 40px rgba(0, 0, 0, 0.50)',
        },
        usage: 'Panels, cards and tiles lifted off the backdrop.',
      },
    ],
  },
  size: {
    tokens: [
      { name: 'target', value: '48px', usage: 'Minimum height and width of anything you can press.' },
      { name: 'icon', value: '24px', usage: 'Icons inside buttons and fields.' },
      { name: 'icon-lg', value: '40px', usage: 'Icons in tile art and stage nodes.' },
      { name: 'content-max', value: '1200px', usage: 'Widest the page content grows.' },
    ],
  },
};

writeFileSync(new URL('tokens.json', root), JSON.stringify(tokens, null, 2) + '\n');

const resolved = themes.map((t, i) => {
  const map = {};
  for (const k of Object.keys(base)) map[k] = base[k][i];
  for (const [h, v] of Object.entries(hues)) { map[h] = v.fill[i]; map[`tint-${h}`] = v.tint[i]; }
  return map;
});

const between = (text, tag, body) => {
  const re = new RegExp(`(/\\* ${tag}:start \\*/)[\\s\\S]*?(/\\* ${tag}:end \\*/)`);
  if (!re.test(text)) throw new Error(`missing ${tag} markers`);
  return text.replace(re, (_, a, b) => `${a}\n${body}\n${b}`);
};

const dataUri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
const cssPath = new URL('components/bundle.css', root);
const backdropCss = themes.map((t, i) => `  --sas-backdrop-${t}: ${dataUri(backdropSvg(t, resolved[i]))};`).join('\n');
const byName = Object.fromEntries(color.map(t => [t.name, t.value]));
const lightValue = name => {
  const v = typeof byName[name] === 'string' ? byName[name] : byName[name].light;
  return v.startsWith('{') ? lightValue(v.slice(1, -1)) : v;
};
const printVars = color
  .map(t => `    --${t.name}: ${t.name === 'canvas' || t.name === 'surface' ? '#ffffff' : lightValue(t.name)};`)
  .join('\n');
const printCss = `@media print {\n  :root, [data-theme] {\n    color-scheme: light;\n${printVars}\n    --shadow-raise: none;\n  }\n}`;
let css = between(readFileSync(cssPath, 'utf8'), 'backdrops', `:root {\n${backdropCss}\n}`);
writeFileSync(cssPath, between(css, 'print', printCss));

const jsPath = new URL('components/bundle.js', root);
writeFileSync(jsPath, between(readFileSync(jsPath, 'utf8'), 'icons', `  var ICONS = ${JSON.stringify(icons, null, 2).replace(/\n/g, '\n  ')};`));

mkdirSync(new URL('icons/', out), { recursive: true });
mkdirSync(new URL('backgrounds/', out), { recursive: true });
for (const name of Object.keys(icons)) writeFileSync(new URL(`icons/${name}.svg`, out), svgFile(name, base.ink[0]));
themes.forEach((t, i) => writeFileSync(new URL(`backgrounds/${t}.svg`, out), backdropSvg(t, resolved[i]) + '\n'));

console.log(`tokens: ${color.length} colors; icons: ${Object.keys(icons).length}; backdrops: ${themes.length}`);
