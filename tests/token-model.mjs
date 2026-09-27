import { readFileSync } from 'node:fs';

export const tokens = JSON.parse(readFileSync(process.env.SAS_TOKENS ?? new URL('../project/tokens.json', import.meta.url), 'utf8'));
export const THEMES = tokens.color.themes.map((t) => t.id);
export const COLORS = new Map(tokens.color.tokens.map((t) => [t.name, t]));
export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const ALIAS = /^\{([^}]+)\}$/;

function raw(name, theme) {
  const v = COLORS.get(name).value;
  if (typeof v === 'string') return v;
  return v[theme] ?? v[THEMES[0]];
}

export function resolve(name, theme, seen = []) {
  if (!COLORS.has(name)) throw new Error(`unknown color token "${name}" via ${seen.join(' -> ') || 'root'}`);
  if (seen.includes(name)) throw new Error(`alias cycle ${[...seen, name].join(' -> ')}`);
  const v = raw(name, theme);
  if (typeof v !== 'string') throw new Error(`${name} has no ${theme} value`);
  const m = v.match(ALIAS);
  return m ? resolve(m[1], theme, [...seen, name]) : v;
}

function rgba(hex) {
  let h = hex.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

function over(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  const mix = (k) => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
  return { r: mix('r'), g: mix('g'), b: mix('b'), a };
}

function luminance({ r, g, b }) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

function ground(name, theme) {
  const c = rgba(resolve(name, theme));
  if (c.a === 1) return c;
  const canvas = name === 'canvas' ? WHITE : over(rgba(resolve('canvas', theme)), WHITE);
  return over(c, canvas);
}

export function ratio(fgName, bgName, theme) {
  const bg = ground(bgName, theme);
  const fg = over(rgba(resolve(fgName, theme)), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
