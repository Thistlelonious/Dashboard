import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const LOCAL = fileURLToPath(new URL('../.local/', import.meta.url));
const MANIFEST = join(LOCAL, 'manifest.json');

export function previews() {
  if (!existsSync(MANIFEST)) throw new Error(`missing ${MANIFEST}; run "npm run build:local" first`);
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

export async function openPreview(page, url, { expectFigtree = true } = {}) {
  await page.goto(url, { waitUntil: 'load' });
  const { figtree, hasText } = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      figtree: [...document.fonts].some((f) => f.family.replace(/["']/g, '') === 'Figtree' && f.status === 'loaded'),
      hasText: document.body.innerText.trim().length > 0,
    };
  });
  if (!hasText) return;
  expect(figtree, expectFigtree
    ? 'Figtree webfont must load from Google Fonts (network needed); otherwise the run silently measures the fallback font'
    : 'Figtree must be blocked in the font-failure run').toBe(expectFigtree);
}

export async function settle(page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

export async function applyTheme(page, theme) {
  await page.evaluate((id) => window.SewAndSo.setTheme(id, { remember: false }), theme);
  await settle(page);
  expect(await page.evaluate(() => document.documentElement.dataset.theme), `setTheme applied ${theme}`).toBe(theme);
}

export async function record(testInfo, name, result) {
  const dir = join(LOCAL, 'violations', testInfo.project.name);
  mkdirSync(dir, { recursive: true });
  const body = JSON.stringify(result, null, 2);
  writeFileSync(join(dir, `${name}.json`), body);
  await testInfo.attach(`${name}.json`, { body, contentType: 'application/json' });
}
