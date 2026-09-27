import { defineConfig, devices } from "@playwright/test"

const baseURL = "http://localhost:5173"

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    reducedMotion: "reduce",
  },
  projects: [
    { name: "phone-320", use: { ...devices["Pixel 7"], viewport: { width: 320, height: 640 } } },
    { name: "pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev -- --strictPort",
    url: baseURL,
    reuseExistingServer: true,
  },
})
