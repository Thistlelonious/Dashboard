import { firefox } from '@playwright/test';
import { cpSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// On this Windows machine, %LOCALAPPDATA% carries an inherited AppContainer capability ACE that makes
// Windows side-by-side loading reject firefox.exe's private mozglue assembly ("side-by-side configuration
// is incorrect"). The identical build runs from a folder without that ACE, so mirror it under .local once.
export function firefoxExecutable() {
  if (process.platform !== 'win32') return undefined;
  const exe = firefox.executablePath();
  const buildDir = dirname(exe);
  const target = join(fileURLToPath(new URL('../.local/browsers/', import.meta.url)), basename(dirname(buildDir)));
  const targetExe = join(target, basename(exe));
  if (!existsSync(targetExe) && existsSync(exe)) cpSync(buildDir, target, { recursive: true });
  return existsSync(targetExe) ? targetExe : undefined;
}
