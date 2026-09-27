import { expect, test } from "@playwright/test"
import { expectCleanLayout, open, themes } from "./screen.ts"

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

for (const hash of routes) {
  for (const theme of themes) {
    test(`${hash} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await open(page, hash)
      await expectCleanLayout(page, testInfo, theme, hash)
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
