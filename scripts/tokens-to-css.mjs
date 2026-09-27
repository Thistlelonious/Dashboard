import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_PATH = join(ROOT, 'project', 'tokens.json');
export const LOCAL_DIR = join(ROOT, '.local');

const ALIAS = /^\{([^}]+)\}$/;

function valueFor(value, themeIds, themeId) {
  if (value === null || typeof value !== 'object') return value;
  return value[themeId] ?? value[themeIds[0]];
}

function cssValue(v) {
  if (typeof v !== 'string') return v;
  const m = v.match(ALIAS);
  return m ? `var(--${m[1]})` : v;
}

function length(v) {
  return typeof v === 'number' ? `${v}px` : v;
}

function lineHeight(v) {
  return typeof v === 'number' && v > 4 ? `${v}px` : v;
}

function declarations(tokens, themeIds, themeId) {
  return tokens.map((t) => `  --${t.name}: ${cssValue(valueFor(t.value, themeIds, themeId))};`);
}

export function tokensToCss(tokens) {
  const themeIds = tokens.color.themes.map((t) => t.id);
  const [first, ...rest] = themeIds;
  const colors = tokens.color.tokens;
  const shadows = tokens.shadow?.tokens ?? [];
  const perThemeShadows = shadows.filter((t) => t.value && typeof t.value === 'object');

  const out = [];
  out.push(`:root, [data-theme="${first}"] {`, ...declarations(colors, themeIds, first), ...declarations(shadows, themeIds, first), '}');
  for (const id of rest) {
    out.push(`[data-theme="${id}"] {`, ...declarations(colors, themeIds, id), ...declarations(perThemeShadows, themeIds, id), '}');
  }

  const scalar = ['spacing', 'radius', 'size'].flatMap((k) => tokens[k]?.tokens ?? []);
  const families = tokens.type?.families ?? {};
  out.push(
    ':root {',
    ...scalar.map((t) => `  --${t.name}: ${length(t.value)};`),
    ...Object.entries(families).map(([k, stack]) => `  --font-${k}: ${stack};`),
    '}',
  );

  for (const group of tokens.type?.groups ?? []) {
    for (const s of group.styles) {
      const family = s.family ?? group.family;
      out.push(
        `.${s.name} {`,
        `  font-family: var(--font-${family});`,
        `  font-size: ${length(s.fontSize)};`,
        `  line-height: ${lineHeight(s.lineHeight)};`,
        `  font-weight: ${s.fontWeight};`,
        '}',
      );
    }
  }
  return out.join('\n') + '\n';
}

export function readTokens(path = TOKENS_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(LOCAL_DIR, { recursive: true });
  const css = tokensToCss(readTokens());
  writeFileSync(join(LOCAL_DIR, 'tokens.css'), css);
  console.log(`wrote ${join(LOCAL_DIR, 'tokens.css')} (${css.length} bytes)`);
}
