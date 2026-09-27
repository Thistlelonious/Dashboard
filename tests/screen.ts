import { expect, type Page, type TestInfo } from "@playwright/test"
import { format, runChecker } from "../../SewAndSo/tests/helpers.mjs"

export const themes = ["light", "colorful", "dark"] as const

export async function open(page: Page, hash: string) {
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

export async function expectCleanLayout(
  page: Page,
  testInfo: TestInfo,
  theme: (typeof themes)[number],
  label: string,
) {
  await page.evaluate((id) => window.SewAndSo.setTheme(id, { remember: false }), theme)
  // The checker measures every text box once, before it scrolls, so it must start from the top.
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page)
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme)
  const result = await runChecker(page, testInfo)
  expect(result.violations, `${label} [${theme}] on ${testInfo.project.name}\n${format(result)}`).toEqual([])
}

export function field(page: Page, label: string) {
  return page
    .locator("label.sas-field")
    .filter({ has: page.locator(".sas-field__label", { hasText: new RegExp(`^${label}$`) }) })
}

export async function fill(page: Page, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    await field(page, label).locator("input").fill(value)
  }
}

export async function choose(page: Page, ...options: string[]) {
  for (const name of options) {
    const radio = page.getByRole("radio", { name, exact: true })
    await radio.click()
    await expect(radio).toHaveAttribute("aria-checked", "true")
  }
}

export function stageTable(page: Page) {
  return page.locator("table.sas-table", { has: page.locator("th", { hasText: "Stage" }) })
}

export async function stageRows(page: Page) {
  return stageTable(page)
    .locator("tbody tr")
    .evaluateAll((rows) => rows.map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent)))
}

export async function total(page: Page) {
  return stageTable(page).locator("tfoot td").nth(1).textContent()
}
