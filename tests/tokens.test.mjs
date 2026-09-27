import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, COLORS, HEX, resolve, ratio } from './token-model.mjs';

function pairs() {
  const names = [...COLORS.keys()];
  const out = [];
  const add = (fg, bg, min, why) => { if (COLORS.has(fg) && COLORS.has(bg)) out.push({ fg, bg, min, why }); };
  for (const bg of ['canvas', 'surface', 'surface-sunk', ...names.filter((n) => n.startsWith('tint-'))]) add('ink', bg, 4.5, 'text');
  for (const n of names) if (COLORS.has(`on-${n}`)) add(`on-${n}`, n, 4.5, 'text on fill');
  for (const bg of ['surface', 'surface-sunk']) add('line', bg, 3, 'control border');
  for (const bg of ['canvas', 'surface', 'surface-sunk']) add('focus', bg, 3, 'focus ring');
  for (const n of names) if (COLORS.has(`on-${n}`) && COLORS.has(`tint-${n}`)) add(n, 'surface', 3, 'graphic mark');
  return out;
}

test('the three themes are light, colorful, dark', () => {
  assert.deepEqual(THEMES, ['light', 'colorful', 'dark']);
});

for (const theme of THEMES) {
  test(`every color token resolves to a hex value and documents its usage [${theme}]`, () => {
    const bad = [];
    for (const [name, t] of COLORS) {
      try {
        const v = resolve(name, theme);
        if (!HEX.test(v)) bad.push(`${name}: "${v}" is not a hex color`);
      } catch (e) {
        bad.push(`${name}: ${e.message}`);
      }
      if (typeof t.usage !== 'string' || !t.usage.trim()) bad.push(`${name}: empty usage`);
    }
    assert.deepEqual(bad, [], `invalid color tokens in ${theme}`);
  });

  test(`contrast pairs meet their minimum [${theme}]`, () => {
    const failing = pairs()
      .map((p) => ({ ...p, ratio: ratio(p.fg, p.bg, theme) }))
      .filter((p) => p.ratio < p.min)
      .map((p) => `${p.fg} on ${p.bg} = ${p.ratio.toFixed(2)} < ${p.min} (${p.why})`);
    assert.deepEqual(failing, [], `contrast failures in ${theme}`);
  });
}

test('contrast table', () => {
  const rows = pairs().map((p) => {
    const cells = THEMES.map((th) => {
      const r = ratio(p.fg, p.bg, th);
      return `${r.toFixed(2).padStart(6)}${r < p.min ? '!' : ' '}`;
    });
    return `${`${p.fg} on ${p.bg}`.padEnd(34)} ${`>=${p.min}`.padEnd(6)} ${cells.join(' ')}`;
  });
  const header = `${'pair'.padEnd(34)} ${'min'.padEnd(6)} ${THEMES.map((th) => th.padStart(7)).join(' ')}`;
  const table = [header, ...rows].join('\n');
  console.log(table);
});
