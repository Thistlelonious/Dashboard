import { test, expect } from '@playwright/test';
import { previews, applyTheme } from './previews.mjs';
import { THEMES, COLORS, resolve } from './token-model.mjs';

test('compiled tokens.css resolves every color token to the independent resolver value in every theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'engine-independent; runs once');
  const p = previews().find((m) => m.name !== 'Cover');
  await page.goto(p.url);
  const mismatches = [];
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const actual = await page.evaluate((names) => {
      const cs = getComputedStyle(document.documentElement);
      return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim().toLowerCase()]));
    }, [...COLORS.keys()]);
    for (const name of COLORS.keys()) {
      const want = resolve(name, theme).toLowerCase();
      if (actual[name] !== want) mismatches.push(`${theme} --${name}: css "${actual[name]}" vs tokens.json "${want}"`);
    }
  }
  expect(mismatches, 'tokens.css must agree with tokens.json').toEqual([]);
});
