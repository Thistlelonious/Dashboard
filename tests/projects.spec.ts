import { expect, type Locator, type Page, test } from "@playwright/test"
import { choose, expectCleanLayout, field, fill, open, stageRows, themes, total } from "./screen.ts"

function iconNames(svgs: Locator) {
  return svgs.evaluateAll((all) =>
    all.map((svg) => {
      const icon = window.SewAndSo.icons.find((name) => {
        const reference = document.createElement("div")
        reference.innerHTML = window.SewAndSo.icon(name)
        return reference.querySelector("svg")?.innerHTML === svg.innerHTML
      })
      return icon ?? null
    }),
  )
}

async function reloadAfterSaves(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("coinvoice")
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction(["projects", "checklist", "settings"])
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
  )
  await page.reload()
}

async function createProject(page: Page, name: string, craft: string, color: string) {
  await fill(page, { Name: name })
  await choose(page, craft, color)
  await page.getByRole("button", { name: "Start project" }).click()
  await expect(card(page, name)).toBeVisible()
  await expect(field(page, "Name").locator("input")).toHaveValue("")
}

function card(page: Page, name: string) {
  return page.getByRole("link", { name, exact: true })
}

function track(page: Page, name: string) {
  return card(page, name).locator("ol.sas-stages > li.sas-stage")
}

async function openCard(page: Page, name: string) {
  await card(page, name).click()
  await expect(page).toHaveURL(/#\/price\/[0-9a-f-]{36}$/)
  await expect(page.locator(".sas-heading", { hasText: name })).toBeVisible()
}

async function budgets(page: Page) {
  return (await stageRows(page)).map((cells) => [cells[0], cells[1]])
}

async function checklistTexts(page: Page) {
  return page.locator("li label.check-item").allTextContents()
}

const seededTexts = [
  "Get a California seller's permit from CDTFA.",
  "Register as a Class A cottage food operation with LA County Public Health, Environmental Health.",
  "Confirm your Shopify plan and card rate in Shopify admin.",
  "Give fabric suppliers a California resale certificate (CDTFA-230).",
]

async function goHome(page: Page) {
  await page.getByRole("link", { name: "coinvoice" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home")
}

test("projects are created on Home, priced, trimmed of Fit, renamed, and deleted across reloads", async ({ page }) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  await open(page, "#/")
  await expect(page.getByText("Start one under New project.")).toBeVisible()

  await page.getByRole("button", { name: "Start project" }).click()
  const name = field(page, "Name")
  await expect(name).toHaveAttribute("data-state", "error")
  await expect(name.locator(".sas-field__message")).toHaveText("Enter a name, like Skirt")
  expect(await iconNames(name.locator(".sas-field__message svg"))).toEqual(["alert"])
  await expect(page.locator("a.sas-card")).toHaveCount(0)

  await createProject(page, "Lined skirt", "Sewing", "Plum")
  const skirt = card(page, "Lined skirt")
  await expect(skirt).toHaveAttribute("data-hue", "plum")
  expect(await iconNames(skirt.locator(".sas-card__art svg"))).toEqual(["fabric"])
  expect(await iconNames(track(page, "Lined skirt").locator("svg"))).toEqual(["scissors", "needle", "tape", "hanger"])
  const states = await track(page, "Lined skirt").evaluateAll((stages) => stages.map((stage) => stage.dataset.state))
  expect(states, "every stage is dashed until the project is built").toEqual([undefined, undefined, undefined, undefined])

  await createProject(page, "Apple pie", "Pies", "Marigold")
  const pie = card(page, "Apple pie")
  await expect(pie).toHaveAttribute("data-hue", "marigold")
  await expect(pie.locator(".sas-card__art svg")).toHaveCount(0)
  await expect(pie.locator("ol.sas-stages")).toHaveCount(0)
  await expect(page.locator("a.sas-card .sas-card__title")).toHaveText(["Apple pie", "Lined skirt"])

  await openCard(page, "Apple pie")
  await expect(page.getByRole("radio", { name: "Sewing" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^(Remove|Add) / })).toHaveCount(0)
  await goHome(page)

  await openCard(page, "Lined skirt")
  const skirtUrl = page.url()
  await expect(field(page, "Price").locator("input")).toHaveValue("")
  await choose(page, "Shopify online")
  await fill(page, { Price: "85", Materials: "32", Overhead: "5" })
  await expect.poll(() => total(page)).toBe("84.7 min")
  await reloadAfterSaves(page)
  await expect(page.getByRole("radio", { name: "Shopify online" })).toHaveAttribute("aria-checked", "true")
  for (const [label, value] of Object.entries({
    Price: "85.00",
    Materials: "32.00",
    Overhead: "5.00",
    "Wage per hour": "20.00",
    Margin: "20",
    "Batch size": "",
  })) {
    await expect(field(page, label).locator("input")).toHaveValue(value)
  }
  await expect.poll(() => total(page)).toBe("84.7 min")

  await fill(page, { Margin: "25", "Wage per hour": "abc" })
  await expect(field(page, "Wage per hour")).toHaveAttribute("data-state", "error")
  await reloadAfterSaves(page)
  await expect(field(page, "Margin").locator("input")).toHaveValue("25")
  await expect(field(page, "Wage per hour").locator("input")).toHaveValue("20.00")
  await fill(page, { Margin: "20" })

  await page.getByRole("button", { name: "Remove Fit" }).click()
  await expect(page.getByRole("button", { name: "Add Fit" })).toBeVisible()
  await expect.poll(() => budgets(page)).toEqual([
    ["Cut", "19.9 min"],
    ["Sew", "44.8 min"],
    ["Finish", "19.9 min"],
  ])
  await reloadAfterSaves(page)
  await expect.poll(() => budgets(page)).toEqual([
    ["Cut", "19.9 min"],
    ["Sew", "44.8 min"],
    ["Finish", "19.9 min"],
  ])
  await goHome(page)
  await expect
    .poll(() => iconNames(track(page, "Lined skirt").locator("svg")))
    .toEqual(["scissors", "needle", "hanger"])

  await page.goto(skirtUrl)
  await page.getByRole("button", { name: "Add Fit" }).click()
  await expect.poll(() => budgets(page)).toEqual([
    ["Cut", "16.9 min"],
    ["Sew", "38.1 min"],
    ["Fit", "12.7 min"],
    ["Finish", "16.9 min"],
  ])
  await goHome(page)
  await expect
    .poll(() => iconNames(track(page, "Lined skirt").locator("svg")))
    .toEqual(["scissors", "needle", "tape", "hanger"])

  await openCard(page, "Lined skirt")
  await page.getByRole("button", { name: "Rename" }).click()
  await fill(page, { Name: " " })
  await page.getByRole("button", { name: "Save" }).click()
  await expect(field(page, "Name").locator(".sas-field__message")).toHaveText("Enter a name, like Skirt")
  await fill(page, { Name: "Wrap skirt" })
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.locator(".sas-heading", { hasText: "Wrap skirt" })).toBeVisible()
  await reloadAfterSaves(page)
  await expect(page.locator(".sas-heading", { hasText: "Wrap skirt" })).toBeVisible()
  await expect.poll(() => total(page)).toBe("84.7 min")

  await goHome(page)
  await openCard(page, "Apple pie")
  const pieUrl = page.url()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("button", { name: "Keep it" }).click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("button", { name: "Delete for good" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home")
  await reloadAfterSaves(page)
  await expect(page.locator("a.sas-card .sas-card__title")).toHaveText(["Wrap skirt"])

  await page.goto(pieUrl)
  await expect(page.getByText("This project isn't on this device. Nothing here is saved.")).toBeVisible()
  await expect(page.getByRole("radio", { name: "Sewing" })).toBeVisible()
  expect(pageErrors).toStrictEqual([])
})

test("the checklist keeps a tick and your own item across reloads, and your own item can be deleted", async ({
  page,
}) => {
  await open(page, "#/setup")
  await expect.poll(() => checklistTexts(page)).toEqual(seededTexts)
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0)

  await page.getByRole("button", { name: "Add item" }).click()
  await expect(field(page, "Item").locator(".sas-field__message")).toHaveText("Enter an item, like Order business cards")

  await page.getByRole("checkbox", { name: "Get a California seller's permit from CDTFA." }).check()
  await fill(page, { Item: "Order business cards" })
  await page.getByRole("button", { name: "Add item" }).click()
  await expect.poll(() => checklistTexts(page)).toEqual([...seededTexts, "Order business cards"])
  await expect(field(page, "Item").locator("input")).toHaveValue("")

  await reloadAfterSaves(page)
  await expect.poll(() => checklistTexts(page)).toEqual([...seededTexts, "Order business cards"])
  const checked = await page.getByRole("checkbox").evaluateAll((boxes) =>
    boxes.map((box) => box instanceof HTMLInputElement && box.checked),
  )
  expect(checked).toEqual([true, false, false, false, false])
  const own = page.locator("li", { has: page.getByText("Order business cards") })
  await expect(own.locator("p")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(1)

  await own.getByRole("button", { name: "Delete" }).click()
  await expect.poll(() => checklistTexts(page)).toEqual(seededTexts)
  await reloadAfterSaves(page)
  await expect.poll(() => checklistTexts(page)).toEqual(seededTexts)
})

test("every setting survives a reload, and one that doesn't parse keeps its last good value", async ({ page }) => {
  await open(page, "#/setup")
  const defaults = { "Business name": "", "Tax rate": "10.5", Deposit: "50", "Estimates valid for": "30" }
  for (const [label, value] of Object.entries(defaults)) {
    await expect(field(page, label).locator("input")).toHaveValue(value)
  }

  const changed = { "Business name": "Thimble Row", "Tax rate": "9.25", Deposit: "25", "Estimates valid for": "14" }
  await fill(page, changed)
  await reloadAfterSaves(page)
  for (const [label, value] of Object.entries(changed)) {
    await expect(field(page, label).locator("input")).toHaveValue(value)
  }

  await fill(page, { Deposit: "150" })
  await expect(field(page, "Deposit").locator(".sas-field__message")).toHaveText("Use a number up to 100, like 50")
  await reloadAfterSaves(page)
  await expect(field(page, "Deposit").locator("input")).toHaveValue("25")
})

test("a fresh browser shows the seeded checklist once and no projects", async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await open(page, "#/setup")
  await expect.poll(() => checklistTexts(page)).toEqual(seededTexts)
  await open(page, "#/")
  await expect(page.getByText("Start one under New project.")).toBeVisible()
  await expect(page.locator("a.sas-card")).toHaveCount(0)
  await context.close()
})

const states: { name: string; hash: string; setUp: (page: Page) => Promise<void> }[] = [
  {
    name: "Home with a sewing and a pie card",
    hash: "#/",
    setUp: async (page) => {
      await createProject(page, "Lined skirt", "Sewing", "Plum")
      await createProject(page, "Apple pie", "Pies", "Marigold")
    },
  },
  {
    name: "Price with a project",
    hash: "#/",
    setUp: async (page) => {
      await createProject(page, "Lined skirt", "Sewing", "Plum")
      await openCard(page, "Lined skirt")
      await choose(page, "Shopify online")
      await fill(page, { Price: "85", Materials: "32", Overhead: "5" })
      await expect.poll(() => total(page)).toBe("84.7 min")
    },
  },
  {
    name: "Setup with your own checklist item",
    hash: "#/setup",
    setUp: async (page) => {
      await fill(page, { Item: "Order business cards" })
      await page.getByRole("button", { name: "Add item" }).click()
      await expect(page.getByRole("checkbox", { name: "Order business cards" })).toBeVisible()
    },
  },
]

for (const state of states) {
  for (const theme of themes) {
    test(`${state.name} [${theme}] has no layout violations`, async ({ page }, testInfo) => {
      await open(page, state.hash)
      await state.setUp(page)
      await expectCleanLayout(page, testInfo, theme, state.name)
    })
  }
}
