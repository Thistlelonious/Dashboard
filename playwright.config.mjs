import { defineConfig, devices } from '@playwright/test';
import { firefoxExecutable } from './tests/firefox-path.mjs';

const firefoxPath = firefoxExecutable();

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.mjs$/,
  outputDir: './.local/test-results',
  fullyParallel: true,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: './.local/report', open: 'never' }],
    ['json', { outputFile: './.local/results.json' }],
  ],
  use: {
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 }, launchOptions: firefoxPath ? { executablePath: firefoxPath } : {} } },
    { name: 'desktop-safari', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'ipad-mini', use: { ...devices['iPad Mini'] } },
    { name: 'phone-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 640 }, screen: { width: 320, height: 640 } } },
  ],
});
