import { fileURLToPath } from 'node:url';

export const CHECKER = fileURLToPath(new URL('./checker.js', import.meta.url));

export async function runChecker(page, testInfo) {
  await page.addScriptTag({ path: CHECKER });
  return page.evaluate((touch) => window.sasCheck({ touch }), !!testInfo.project.use.hasTouch);
}

export function format(result) {
  const lines = result.violations.map((v) => `${v.kind}  ${v.path}  "${v.text}"  ${JSON.stringify(v.detail)}`);
  return `${result.violations.length} violation(s) at ${result.viewport.w}x${result.viewport.h} (touch=${result.touch}); opt-outs ${JSON.stringify(result.optOuts)}\n${lines.join('\n')}`;
}
