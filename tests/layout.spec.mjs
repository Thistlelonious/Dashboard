import { test, expect } from '@playwright/test';
import { runChecker, format } from './helpers.mjs';
import { previews, openPreview, applyTheme, settle, record } from './previews.mjs';
import { THEMES } from './token-model.mjs';

const ALL = previews();
const DESKTOP = new Set(['desktop-chrome', 'desktop-firefox', 'desktop-safari']);
const FONT_FAILURE_PROJECTS = new Set(['desktop-chrome', 'phone-320']);
const FONT_FAILURE_PREVIEWS = ['Workroom', 'ProjectCard', 'StageTrack'];

for (const p of ALL.filter((m) => m.name !== 'Cover')) {
  for (const theme of THEMES) {
    test(`${p.name} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await openPreview(page, p.url);
      await applyTheme(page, theme);
      const result = await runChecker(page, testInfo);
      await record(testInfo, `${p.name}--${theme}`, result);
      expect(result.violations, `${p.name} [${theme}] on ${testInfo.project.name}\n${format(result)}`).toEqual([]);
    });
  }
}

// Cover is fixed 960px artwork, so only its text-on-text collisions are meaningful, and only at desktop width.
const cover = ALL.find((m) => m.name === 'Cover');
if (cover) {
  for (const theme of THEMES) {
    test(`Cover [${theme}] text does not collide`, async ({ page }, testInfo) => {
      test.skip(!DESKTOP.has(testInfo.project.name), 'Cover is fixed 960px artwork; checked at desktop width only');
      await openPreview(page, cover.url);
      await applyTheme(page, theme);
      const result = await runChecker(page, testInfo);
      result.violations = result.violations.filter((v) => v.kind === 'OVERLAP' && v.detail.a.type === 'text' && v.detail.b.type === 'text');
      await record(testInfo, `Cover--${theme}`, result);
      expect(result.violations, `Cover [${theme}] on ${testInfo.project.name}\n${format(result)}`).toEqual([]);
    });
  }
}

const workroom = ALL.find((m) => m.name === 'Workroom');
test('Workroom theme switcher works by real clicks and every theme stays clean', async ({ page }, testInfo) => {
  expect(workroom, 'Workroom preview exists').toBeTruthy();
  await openPreview(page, workroom.url);
  const options = page.locator('[data-sas-theme]');
  const count = await options.count();
  expect(count, 'Workroom has theme switcher buttons').toBeGreaterThanOrEqual(THEMES.length);
  const ids = [];
  for (let i = 0; i < count; i++) ids.push(await options.nth(i).getAttribute('data-sas-theme'));
  expect([...new Set(ids)].sort(), 'switcher offers every theme').toEqual([...THEMES].sort());

  for (let i = 0; i < count; i++) {
    const id = ids[i];
    await options.nth(i).click();
    await page.waitForTimeout(400);
    await settle(page);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect.soft(theme, `clicking switcher option #${i} sets data-theme`).toBe(id);
    const result = await runChecker(page, testInfo);
    await record(testInfo, `Workroom--click-${i}-${id}`, result);
    expect.soft(result.violations, `Workroom after clicking ${id} (#${i}) on ${testInfo.project.name}\n${format(result)}`).toEqual([]);
  }
});

for (const name of FONT_FAILURE_PREVIEWS) {
  test(`${name} survives a webfont failure without overlap or overflow`, async ({ page }, testInfo) => {
    test.skip(!FONT_FAILURE_PROJECTS.has(testInfo.project.name), 'font-failure run is desktop chromium and the 320px phone');
    const p = ALL.find((m) => m.name === name);
    expect(p, `${name} preview exists`).toBeTruthy();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await openPreview(page, p.url, { expectFigtree: false });
    const result = await runChecker(page, testInfo);
    result.violations = result.violations.filter((v) => v.kind === 'OVERLAP' || v.kind === 'OVERFLOW');
    await record(testInfo, `${name}--font-failure`, result);
    expect(result.violations, `${name} with fallback font on ${testInfo.project.name}\n${format(result)}`).toEqual([]);
  });
}
