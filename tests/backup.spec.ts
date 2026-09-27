import { writeFile } from "node:fs/promises"
import { expect, type Page, test } from "@playwright/test"
import {
  card,
  createProject,
  expectCleanLayout,
  field,
  fill,
  goHome,
  open,
  openCard,
  reloadAfterSaves,
  themes,
} from "./screen.ts"

const routes = ["#/", "#/price", "#/stock", "#/invoices", "#/setup"]
const notABackup = "This file isn't a coinvoice backup. Pick a file you sent from Setup."

function banner(page: Page) {
  return page.locator("aside.sas-panel")
}

async function sendBackup(page: Page, path: string) {
  await open(page, "#/setup")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Send backup" }).click()
  const file = await download
  await file.saveAs(path)
  return file.suggestedFilename()
}

async function chooseBackup(page: Page, path: string) {
  await open(page, "#/setup")
  const chooser = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Merge backup" }).click()
  await (await chooser).setFiles(path)
}

async function mergeBackup(page: Page, path: string, counts: string) {
  await chooseBackup(page, path)
  await expect(page.getByText(counts, { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Merge", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText(`Merged. ${counts}`)
}

async function cardTitles(page: Page) {
  await goHome(page)
  return page.locator("a.sas-card .sas-card__title").allTextContents()
}

test("backups send, merge into a second browser, and never undo a newer edit or a delete", async ({ page, browser }, testInfo) => {
  for (const hash of routes) {
    await open(page, hash)
    await expect(banner(page)).toContainText("No backup yet")
    await expect(banner(page).getByRole("link", { name: "Back up" })).toHaveAttribute("href", "#/setup")
  }

  await open(page, "#/")
  await createProject(page, "Lined skirt", "Sewing", "Plum")
  await createProject(page, "Apple pie", "Pies", "Marigold")
  await open(page, "#/setup")
  await page.getByRole("checkbox", { name: "Get a California seller's permit from CDTFA." }).check()
  await fill(page, { "Business name": "Thread and Crust" })

  const first = testInfo.outputPath("first-backup.json")
  const today = await page.evaluate(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return {
      file: `coinvoice-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`,
      shown: now.toLocaleDateString(undefined, { dateStyle: "medium" }),
    }
  })
  expect(await sendBackup(page, first)).toBe(today.file)
  await expect(banner(page)).toHaveCount(0)
  await reloadAfterSaves(page)
  await expect(page.getByText(`Last backup ${today.shown}`)).toBeVisible()
  await expect(page.getByText(/^Storage (kept|may be cleared)$/)).toBeVisible()
  await goHome(page)
  await expect(banner(page)).toHaveCount(0)

  await openCard(page, "Lined skirt")
  await page.getByRole("button", { name: "Rename" }).click()
  await fill(page, { Name: "Lined skirt v2" })
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.locator(".sas-heading", { hasText: "Lined skirt v2" })).toBeVisible()
  await mergeBackup(page, first, "0 added, 0 updated, 7 unchanged")
  expect(await cardTitles(page)).toEqual(["Lined skirt v2", "Apple pie"])

  const privateWindow = await browser.newContext()
  const other = await privateWindow.newPage()
  await mergeBackup(other, first, "2 added, 2 updated, 3 unchanged")
  await expect(other.getByRole("checkbox", { name: "Get a California seller's permit from CDTFA." })).toBeChecked()
  await expect(field(other, "Business name").locator("input")).toHaveValue("Thread and Crust")
  await expect(banner(other)).toContainText("No backup yet")
  expect((await cardTitles(other)).sort()).toEqual(["Apple pie", "Lined skirt"])

  await openCard(page, "Apple pie")
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("button", { name: "Delete for good" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home")
  const second = testInfo.outputPath("second-backup.json")
  await sendBackup(page, second)
  await mergeBackup(other, second, "0 added, 2 updated, 5 unchanged")
  expect(await cardTitles(other)).toEqual(["Lined skirt v2"])
  await reloadAfterSaves(other)
  await expect(card(other, "Apple pie")).toHaveCount(0)

  const stranger = testInfo.outputPath("not-a-backup.json")
  await writeFile(stranger, JSON.stringify({ name: "coinvoice", version: "0.0.0" }))
  await chooseBackup(other, stranger)
  await expect(other.getByRole("alert")).toHaveText(notABackup)
  await expect(other.getByRole("button", { name: "Merge", exact: true })).toHaveCount(0)
  expect(await cardTitles(other)).toEqual(["Lined skirt v2"])
  await privateWindow.close()
})

test("the banner comes back once the last backup is more than 14 days old", async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date(2026, 8, 1, 10, 0))
  await sendBackup(page, testInfo.outputPath("backup.json"))
  await expect(banner(page)).toHaveCount(0)
  await page.clock.setFixedTime(new Date(2026, 8, 15, 10, 0))
  await reloadAfterSaves(page)
  await expect(banner(page)).toHaveCount(0)
  await page.clock.setFixedTime(new Date(2026, 8, 16, 10, 0))
  await reloadAfterSaves(page)
  await expect(banner(page)).toContainText("Last backup 15 days ago")
  await banner(page).getByRole("link", { name: "Back up" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Setup")
})

const states: { name: string; setUp: (page: Page, path: string) => Promise<void> }[] = [
  {
    name: "Setup with a backup ready to merge",
    setUp: async (page, path) => {
      await sendBackup(page, path)
      await chooseBackup(page, path)
      await expect(page.getByRole("button", { name: "Merge", exact: true })).toBeVisible()
    },
  },
  {
    name: "Setup after a merge",
    setUp: async (page, path) => {
      await sendBackup(page, path)
      await mergeBackup(page, path, "0 added, 0 updated, 5 unchanged")
    },
  },
  {
    name: "Setup with a file that isn't a backup",
    setUp: async (page, path) => {
      await writeFile(path, "[]")
      await chooseBackup(page, path)
      await expect(page.getByRole("alert")).toHaveText(notABackup)
    },
  },
  {
    name: "Home with a stale backup",
    setUp: async (page, path) => {
      await page.clock.setFixedTime(new Date(2026, 8, 1, 10, 0))
      await sendBackup(page, path)
      await page.clock.setFixedTime(new Date(2026, 8, 16, 10, 0))
      await open(page, "#/")
      await reloadAfterSaves(page)
      await expect(banner(page)).toContainText("Last backup 15 days ago")
    },
  },
]

for (const state of states) {
  for (const theme of themes) {
    test(`${state.name} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await state.setUp(page, testInfo.outputPath("backup.json"))
      await expectCleanLayout(page, testInfo, theme, state.name)
    })
  }
}

test("a field keeps working after a merge remounts the settings", async ({ page }, testInfo) => {
  const path = testInfo.outputPath("backup.json")
  await sendBackup(page, path)
  await mergeBackup(page, path, "0 added, 0 updated, 5 unchanged")
  await fill(page, { "Business name": "Thread and Crust" })
  await reloadAfterSaves(page)
  await expect(field(page, "Business name").locator("input")).toHaveValue("Thread and Crust")
})
