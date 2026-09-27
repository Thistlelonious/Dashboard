import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { runChecker, format } from './helpers.mjs';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));

const CASES = [
  { file: 'clean.html', kinds: [] },
  { file: 'overlap-labels.html', kinds: ['OVERLAP'] },
  { file: 'overlap-controls.html', kinds: ['OVERLAP'] },
  { file: 'small-caption.html', kinds: ['SMALL-TEXT'] },
  { file: 'underline-link.html', kinds: ['UNDERLINE'] },
  { file: 'small-button.html', kinds: ['TOUCH-TARGET'] },
  { file: 'grey-on-grey.html', kinds: ['CONTRAST'] },
  { file: 'text-on-image.html', kinds: ['TEXT-ON-IMAGE'] },
  { file: 'text-on-backdrop.html', kinds: ['TEXT-ON-IMAGE'] },
  { file: 'wide-320.html', kinds: ['OVERFLOW'], viewport: { width: 320, height: 640 } },
];

for (const c of CASES) {
  test(`fixture ${c.file} reports ${c.kinds.join(', ') || 'nothing'}`, async ({ page }, testInfo) => {
    if (c.viewport) await page.setViewportSize(c.viewport);
    await page.goto(pathToFileURL(FIXTURES + c.file).href);
    const result = await runChecker(page, testInfo);
    await testInfo.attach('checker-result', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    const kinds = [...new Set(result.violations.map((v) => v.kind))].sort();
    expect(kinds, `${c.file} must report exactly ${JSON.stringify(c.kinds)}\n${format(result)}`).toEqual(c.kinds);
    if (c.file === 'clean.html') expect(result.optOuts.layerBack, 'clean fixture opt-out count is visible').toBe(1);
  });
}
