import { expect, type Page, test } from "@playwright/test"
import { choose, expectCleanLayout, field, fill, open, reloadAfterSaves, themes } from "./screen.ts"

function section(page: Page, title: string) {
  return page.locator("section.sas-panel", { has: page.getByRole("heading", { level: 2, name: title, exact: true }) })
}

async function addPurchase(page: Page, values: Record<string, string>, craft?: string) {
  const form = section(page, "Add purchase")
  await fill(form, values)
  if (craft !== undefined) await choose(page, craft)
  await form.getByRole("button", { name: "Add purchase" }).click()
}

async function adjust(page: Page, values: Record<string, string>) {
  const form = section(page, "Adjust stock")
  await fill(form, values)
  await form.getByRole("button", { name: "Adjust" }).click()
}

function row(page: Page, name: string) {
  return page.locator("tr", { has: page.getByRole("link", { name, exact: true }) }).locator("td")
}

async function tableRows(page: Page, title: string) {
  return section(page, title)
    .locator("tbody tr")
    .evaluateAll((rows) => rows.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent)))
}

async function lining(page: Page) {
  await addPurchase(page, {
    Item: "Bemberg lining",
    Category: "Fabric",
    Quantity: "1",
    Unit: "yd",
    "Total paid": "6.00",
    Vendor: "JOANN",
    Date: "2026-09-01",
  })
  await expect(page.getByRole("status")).toHaveText("Added 1 yd of Bemberg lining.")
}

async function flour(page: Page) {
  await addPurchase(
    page,
    {
      Item: "Flour, all-purpose",
      Category: "Baking",
      Quantity: "5",
      Unit: "lb",
      "Total paid": "3.90",
      Conversion: "1 cup = 4.25 oz",
      Vendor: "Smart & Final",
      Date: "2026-09-02",
    },
    "Pies",
  )
  await expect(page.getByRole("status")).toHaveText("Added 5 lb of Flour, all-purpose.")
}

test("purchases and adjustments give the stock on hand and average cost, across a reload and a backup", async ({ page, browser }, testInfo) => {
  await open(page, "#/stock")
  await expect(page.getByText("Add a purchase to start.")).toBeVisible()
  await expect(section(page, "Adjust stock")).toHaveCount(0)

  await lining(page)
  await expect(row(page, "Bemberg lining")).toHaveText(["Bemberg lining", "1 yd", "$6.00 per yard"])

  await fill(section(page, "Add purchase"), { Item: "bemberg lining" })
  await expect(page.getByText("Adds to Bemberg lining, counted in yards.")).toBeVisible()
  await expect(field(section(page, "Add purchase"), "Category")).toHaveCount(0)
  await addPurchase(page, { Quantity: "2", Unit: "", "Total paid": "15", Date: "2026-09-10" })
  await expect(page.getByRole("status")).toHaveText("Added 2 yd of bemberg lining.")
  await expect(row(page, "Bemberg lining")).toHaveText(["Bemberg lining", "3 yd", "$7.00 per yard"])

  await adjust(page, { Item: "Bemberg lining", Quantity: "1", Date: "2026-09-11" })
  await expect(row(page, "Bemberg lining")).toHaveText(["Bemberg lining", "2 yd", "$7.00 per yard"])
  await reloadAfterSaves(page)
  await expect(row(page, "Bemberg lining")).toHaveText(["Bemberg lining", "2 yd", "$7.00 per yard"])

  await page.getByRole("link", { name: "Bemberg lining", exact: true }).click()
  await expect(page).toHaveURL(/#\/stock\/[0-9a-f-]{36}$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bemberg lining")
  expect(await tableRows(page, "Purchases")).toEqual([
    ["2026-09-01", "JOANN", "1 yd", "$6.00", "$6.00 per yard"],
    ["2026-09-10", "JOANN", "2 yd", "$15.00", "$7.50 per yard"],
  ])
  expect(await tableRows(page, "Uses")).toEqual([["2026-09-11", "1 yd", "Adjustment"]])

  await open(page, "#/stock")
  await flour(page)
  await page.getByRole("link", { name: "Flour, all-purpose", exact: true }).click()
  const onHand = section(page, "On hand")
  await expect(onHand).toContainText("5 lb")
  await expect(onHand).toContainText("Average cost $0.78 per pound")
  await expect(onHand).toContainText("1 cup = 4.25 oz")

  const backup = testInfo.outputPath("backup.json")
  await open(page, "#/setup")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Send backup" }).click()
  await (await download).saveAs(backup)

  const privateWindow = await browser.newContext()
  const other = await privateWindow.newPage()
  await open(other, "#/setup")
  const chooser = other.waitForEvent("filechooser")
  await other.getByRole("button", { name: "Merge backup" }).click()
  await (await chooser).setFiles(backup)
  await other.getByRole("button", { name: "Merge", exact: true }).click()
  await expect(other.getByRole("status")).toContainText("Merged.")
  await open(other, "#/stock")
  await expect(row(other, "Bemberg lining")).toHaveText(["Bemberg lining", "2 yd", "$7.00 per yard"])
  await expect(row(other, "Flour, all-purpose")).toHaveText(["Flour, all-purpose", "5 lb", "$0.78 per pound"])
  await privateWindow.close()
})

test("a purchase with missing fields shows a message on each, and adds nothing", async ({ page }) => {
  await open(page, "#/stock")
  await section(page, "Add purchase").getByRole("button", { name: "Add purchase" }).click()
  await expect(field(page, "Item").locator(".sas-field__message")).toHaveText("Enter an item, like Bemberg lining")
  await expect(field(page, "Total paid").locator(".sas-field__message")).toHaveText("Use an amount, like 6.00")
  await expect(page.getByText("Add a purchase to start.")).toBeVisible()
})

test("using more than is on hand shows the item as short", async ({ page }) => {
  await open(page, "#/stock")
  await lining(page)
  await adjust(page, { Item: "Bemberg lining", Quantity: "3", Unit: "yd", Date: "2026-09-02" })
  await expect(row(page, "Bemberg lining")).toHaveText(["Bemberg lining", "Short by 2 yd", "$6.00 per yard"])
})

const states: { name: string; setUp: (page: Page) => Promise<void> }[] = [
  {
    name: "Stock with fabric, flour, and a short item",
    setUp: async (page) => {
      await open(page, "#/stock")
      await lining(page)
      await flour(page)
      await adjust(page, { Item: "Bemberg lining", Quantity: "3", Unit: "yd", Date: "2026-09-02" })
      await expect(row(page, "Bemberg lining")).toContainText(["Short by 2 yd"])
    },
  },
  {
    name: "Stock with every purchase field showing a message",
    setUp: async (page) => {
      await open(page, "#/stock")
      await fill(section(page, "Add purchase"), { Unit: "lb", Conversion: "a cup", Date: "soon" })
      await section(page, "Add purchase").getByRole("button", { name: "Add purchase" }).click()
      await expect(field(page, "Conversion").locator(".sas-field__message")).toBeVisible()
    },
  },
  {
    name: "Item with purchases, a use, and a conversion",
    setUp: async (page) => {
      await open(page, "#/stock")
      await flour(page)
      await adjust(page, { Item: "Flour, all-purpose", Quantity: "2", Unit: "cup", Date: "2026-09-03" })
      await page.getByRole("link", { name: "Flour, all-purpose", exact: true }).click()
      await expect(section(page, "Uses")).toContainText("2 cup")
    },
  },
]

for (const state of states) {
  for (const theme of themes) {
    test(`${state.name} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await state.setUp(page)
      await expectCleanLayout(page, testInfo, theme, state.name)
    })
  }
}
