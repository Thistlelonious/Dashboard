import { test, expect } from '@playwright/test';
import { runChecker, format } from './helpers.mjs';
import { previews, openPreview } from './previews.mjs';

// Each case breaks the real Workroom DOM in one way, proving the checker sees that defect on real markup
// in every engine, not only on the synthetic fixtures.
const DEFECTS = {
  OVERLAP: () => {
    const [a, b] = document.querySelectorAll('.sas-card__title');
    const r = a.getBoundingClientRect();
    Object.assign(b.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, margin: '0' });
  },
  'SMALL-TEXT': () => { document.querySelector('.sas-field__label').style.fontSize = '14px'; },
  UNDERLINE: () => { document.querySelector('.sas-card').style.textDecoration = 'underline'; },
  'TOUCH-TARGET': () => {
    Object.assign(document.querySelector('.sas-button--icon').style,
      { width: '30px', height: '30px', minWidth: '0', minHeight: '0', padding: '0' });
  },
  CONTRAST: () => {
    const title = document.querySelector('.sas-card__title');
    let e = title;
    while (e && getComputedStyle(e).backgroundColor.match(/rgba\(.*,\s*0\)$|transparent/)) e = e.parentElement;
    title.style.color = getComputedStyle(e).backgroundColor;
  },
  'TEXT-ON-IMAGE': () => { document.querySelector('.sas-hero').style.background = 'none'; },
  OVERFLOW: () => {
    const slab = document.createElement('div');
    slab.style.cssText = 'width: 3000px; height: 10px;';
    document.body.appendChild(slab);
  },
};

const workroom = previews().find((m) => m.name === 'Workroom');

for (const [kind, inject] of Object.entries(DEFECTS)) {
  test(`checker reports ${kind} when Workroom is broken that way`, async ({ page }, testInfo) => {
    await openPreview(page, workroom.url);
    const count = (r) => r.violations.filter((v) => v.kind === kind).length;
    const before = await runChecker(page, testInfo);
    await page.evaluate(inject);
    const after = await runChecker(page, testInfo);
    expect(count(after), `injected ${kind} must add a ${kind} violation\n${format(after)}`).toBeGreaterThan(count(before));
  });
}
