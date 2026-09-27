import { expect, type Page, test } from "@playwright/test"
import { format, runChecker } from "../../SewAndSo/tests/helpers.mjs"

const themes = ["light", "colorful", "dark"] as const

const routes = [
  "#/",
  "#/price",
  "#/price/p1",
  "#/build/p1",
  "#/stock",
  "#/stock/i1",
  "#/invoices",
  "#/invoices/d1",
  "#/print/d1/estimate",
  "#/print/d1/invoice",
  "#/print/d1/cost-sheet",
  "#/setup",
]

async function open(page: Page, hash: string) {
  await page.goto(`/${hash}`)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const figtree = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].some((f) => f.family.replace(/["']/g, "") === "Figtree" && f.status === "loaded")
  })
  expect(figtree, "Figtree must load from Google Fonts, or the checker measures the fallback font").toBe(true)
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

for (const hash of routes) {
  for (const theme of themes) {
    test(`${hash} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await open(page, hash)
      await page.evaluate((id) => window.SewAndSo.setTheme(id, { remember: false }), theme)
      await settle(page)
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme)
      const result = await runChecker(page, testInfo)
      expect(result.violations, `${hash} [${theme}] on ${testInfo.project.name}\n${format(result)}`).toEqual([])
    })
  }
}

test("a theme chosen with the switch survives a reload", async ({ page }) => {
  await open(page, "#/")
  await page.getByRole("radio", { name: "Dark" }).click()
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true")
})

test("each tile opens its screen and the brand leads back to Home", async ({ page }) => {
  for (const name of ["Price", "Stock", "Invoices", "Setup"]) {
    await open(page, "#/")
    await page.getByRole("link", { name }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name)
    await page.getByRole("link", { name: "coinvoice" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home")
  }
})
