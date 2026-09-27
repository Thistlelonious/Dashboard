import { expect, type Page, test } from "@playwright/test"
import { expectCleanLayout, open, themes } from "./screen.ts"

const waiting =
  "Close coinvoice in your other tabs and windows, including the installed app. This page finishes updating once they close."

async function oldTabWithVersion1(page: Page) {
  const old = await page.context().newPage()
  await old.route("**/src/main.tsx*", (route) => route.fulfill({ contentType: "text/javascript", body: "" }))
  await old.goto("./#/")
  await old.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("coinvoice", 1)
        request.onupgradeneeded = () => {
          request.result.createObjectStore("projects", { keyPath: "id" })
          request.result.createObjectStore("checklist", { keyPath: "id" })
          request.result.createObjectStore("settings")
        }
        request.onsuccess = () => {
          Object.assign(window, { oldConnection: request.result })
          resolve()
        }
        request.onerror = () => reject(request.error)
      }),
  )
  return old
}

test("an upgrade held up by an old tab says what to close, then loads once the tab lets go", async ({ page }) => {
  const old = await oldTabWithVersion1(page)
  await page.goto("./#/stock")
  await expect(page.getByRole("alert")).toHaveText(waiting)
  await expect(page.getByRole("heading", { name: "Add purchase" })).toHaveCount(0)

  await old.evaluate(() => {
    if ("oldConnection" in window && window.oldConnection instanceof IDBDatabase) window.oldConnection.close()
  })
  await expect(page.getByRole("heading", { name: "Add purchase" })).toBeVisible()
  await expect(page.getByRole("alert")).toHaveCount(0)
})

test("a tab replaced by a newer version offers a reload", async ({ page }) => {
  await open(page, "#/setup")
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const newer = indexedDB.open("coinvoice", 99)
        newer.onsuccess = () => {
          newer.result.close()
          resolve()
        }
      }),
  )
  await expect(page.getByRole("alert")).toContainText("coinvoice was updated in another tab. Reload to keep working.")
  await expect(page.getByRole("button", { name: "Reload" })).toBeVisible()
})

for (const theme of themes) {
  test(`Stock waiting on an old tab [${theme}] has no layout violations`, async ({ page }, testInfo) => {
    await oldTabWithVersion1(page)
    await open(page, "#/stock")
    await expect(page.getByRole("alert")).toHaveText(waiting)
    await expectCleanLayout(page, testInfo, theme, "Stock waiting on an old tab")
  })
}
