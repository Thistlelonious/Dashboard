import { expect, type Page, test } from "@playwright/test"
import { choose, expectCleanLayout, field, fill, open, stageRows, stageTable, themes, total } from "./screen.ts"

async function stageIcons(page: Page) {
  return stageTable(page)
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => {
        const drawn = row.querySelector("td svg")?.innerHTML
        const icon = window.SewAndSo.icons.find((name) => {
          const reference = document.createElement("div")
          reference.innerHTML = window.SewAndSo.icon(name)
          return reference.querySelector("svg")?.innerHTML === drawn
        })
        return icon ?? null
      }),
    )
}

function amount(page: Page, label: string) {
  return page.locator(`table.sas-table tbody td[data-label="${label}"]`)
}

test("the Price screen works through the batch 2 stop and check list", async ({ page }) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  await open(page, "#/price")

  await expect(page.getByRole("radio", { name: "Sewing" })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("radio", { name: "Time from price" })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("radio", { name: "Cash or direct" })).toHaveAttribute("aria-checked", "true")
  await expect(field(page, "Wage per hour").locator("input")).toHaveValue("20.00")
  await expect(field(page, "Margin").locator("input")).toHaveValue("20")

  await choose(page, "Shopify online")
  await fill(page, { Price: "85", Materials: "32", Overhead: "5" })
  expect(await stageRows(page)).toStrictEqual([
    ["Cut", "16.9 min", "14.7 min"],
    ["Sew", "38.1 min", "33.1 min"],
    ["Fit", "12.7 min", "11.0 min"],
    ["Finish", "16.9 min", "14.7 min"],
  ])
  expect(await stageIcons(page)).toStrictEqual(["scissors", "needle", "tape", "hanger"])
  expect(await total(page)).toBe("84.7 min")
  await expect(amount(page, "Fees")).toHaveText("$2.77")
  await expect(amount(page, "Profit target")).toHaveText("$17.00")
  await expect(amount(page, "Labor budget")).toHaveText("$28.23")

  await choose(page, "Etsy")
  expect(await total(page)).toBe("67.4 min")

  await choose(page, "Price from time", "Shopify online")
  await fill(page, { Time: "360" })
  await expect(amount(page, "Price")).toHaveText("$204.02")
  await expect(amount(page, "Fees")).toHaveText("$6.22")
  await expect(amount(page, "Profit target")).toHaveText("$40.80")
  await choose(page, "Etsy")
  await expect(amount(page, "Price")).toHaveText("$223.33")

  await choose(page, "Pies", "Time from price", "Cash or direct")
  await fill(page, { Price: "32", Materials: "14", Overhead: "3" })
  expect(await total(page)).toBe("25.8 min")
  expect((await stageRows(page)).map((cells) => cells[1])).toStrictEqual([
    "7.7 min",
    "6.5 min",
    "5.2 min",
    "2.6 min",
    "3.9 min",
  ])
  expect(await stageIcons(page)).toStrictEqual([null, null, null, null, null])

  await choose(page, "Sewing", "Shopify online")
  await fill(page, { Price: "30", Materials: "32", Overhead: "5" })
  await expect(page.getByText("This price can't reach your margin.")).toHaveText(
    "This price can't reach your margin. The break-even price is $48.38.",
  )

  await fill(page, { Price: "abc" })
  const price = field(page, "Price")
  await expect(price).toHaveAttribute("data-state", "error")
  await expect(price.locator("input")).toHaveAttribute("aria-invalid", "true")
  await expect(price.locator(".sas-field__message")).toHaveText("Use a number, like 85.00")
  expect(
    await price.locator(".sas-field__message svg").evaluate((svg) => {
      const reference = document.createElement("div")
      reference.innerHTML = window.SewAndSo.icon("alert")
      return svg.innerHTML === reference.querySelector("svg")?.innerHTML
    }),
    "the price message leads with the alert icon",
  ).toBe(true)
  await expect(page.locator(".sas-field[data-state=error]")).toHaveCount(1)
  await expect(page.getByText("Fix the marked fields to see the results.")).toBeVisible()

  await fill(page, { Price: "85" })
  await expect(page.locator(".sas-field[data-state=error]")).toHaveCount(0)
  expect(await total(page)).toBe("84.7 min")
  expect(pageErrors).toStrictEqual([])
})

test("a batch of 6 pies shows minutes each for the stages that are not batchable", async ({ page }) => {
  await open(page, "#/price")
  await choose(page, "Pies")
  await fill(page, { Price: "32", Materials: "14", Overhead: "3", "Batch size": "6" })
  expect((await stageRows(page)).map((cells) => [cells[0], cells[3]])).toStrictEqual([
    ["Crust", ""],
    ["Filling", ""],
    ["Assembly and crimping", "0.9 min"],
    ["Baking (hands-on)", ""],
    ["Cooling and packaging", "0.6 min"],
  ])
})

test("every stage table cell carries a data-label", async ({ page }) => {
  await open(page, "#/price")
  await choose(page, "Shopify online")
  await fill(page, { Price: "85", Materials: "32", Overhead: "5", "Batch size": "3" })
  const cells = page.locator("table.sas-table td")
  await expect(cells.first()).toBeVisible()
  expect(await cells.evaluateAll((all) => all.filter((cell) => !cell.dataset.label).length)).toBe(0)
})

const states: { name: string; setUp: (page: Page) => Promise<void> }[] = [
  {
    name: "stage table",
    setUp: async (page) => {
      await choose(page, "Shopify online")
      await fill(page, { Price: "85", Materials: "32", Overhead: "5", "Batch size": "3" })
      await expect(stageTable(page)).toBeVisible()
    },
  },
  {
    name: "price from time",
    setUp: async (page) => {
      await choose(page, "Price from time", "Shopify online")
      await fill(page, { Time: "360", Materials: "32", Overhead: "5" })
      await expect(amount(page, "Price")).toHaveText("$204.02")
    },
  },
  {
    name: "short price",
    setUp: async (page) => {
      await choose(page, "Shopify online")
      await fill(page, { Price: "30", Materials: "32", Overhead: "5" })
      await expect(page.getByText("This price can't reach your margin.")).toBeVisible()
    },
  },
  {
    name: "field error",
    setUp: async (page) => {
      await fill(page, { Price: "abc" })
      await expect(field(page, "Price").locator(".sas-field__message")).toBeVisible()
    },
  },
]

for (const state of states) {
  for (const theme of themes) {
    test(`#/price with a ${state.name} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await open(page, "#/price")
      await state.setUp(page)
      await expectCleanLayout(page, testInfo, theme, `#/price with a ${state.name}`)
    })
  }
}
