import { expect, type Page, test } from "@playwright/test"
import { previewURL } from "../playwright.config.ts"
import { card, createProject } from "./screen.ts"

async function openBuilt(page: Page, hash: string) {
  await page.goto(`${previewURL}${hash}`)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
}

function figtreeLoaded(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].some((font) => font.family.replace(/["']/g, "") === "Figtree" && font.status === "loaded")
  })
}

function cachedFonts(page: Page) {
  return page.evaluate(async () => (await (await caches.open("google-fonts")).keys()).length)
}

test("the built site serves a manifest with the spool icons and a service worker", async ({ request }) => {
  const manifest = await (await request.get(`${previewURL}manifest.webmanifest`)).json()
  expect(manifest).toMatchObject({
    name: "coinvoice",
    short_name: "coinvoice",
    display: "standalone",
    start_url: "./",
    scope: "./",
    theme_color: "#f4eee6",
    background_color: "#f4eee6",
  })
  for (const icon of manifest.icons) {
    const response = await request.get(new URL(icon.src, `${previewURL}manifest.webmanifest`).href)
    expect(response.headers()["content-type"]).toBe("image/png")
  }
  expect((await request.get(`${previewURL}sw.js`)).ok()).toBe(true)
})

test("a reload keeps the screen, and the app opens offline with its font, theme, and projects", async ({ page, context }) => {
  await openBuilt(page, "#/stock")
  await page.reload()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stock")

  await openBuilt(page, "#/")
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await expect.poll(() => cachedFonts(page)).toBeGreaterThan(0)
  await createProject(page, "Lined skirt", "Sewing", "Plum")
  await page.getByRole("radio", { name: "Dark" }).click()

  await context.setOffline(true)
  await page.close()
  const reopened = await context.newPage()
  await openBuilt(reopened, "#/")
  await expect(card(reopened, "Lined skirt")).toBeVisible()
  await expect(reopened.locator("html")).toHaveAttribute("data-theme", "dark")
  expect(await figtreeLoaded(reopened)).toBe(true)
  await context.setOffline(false)
})
