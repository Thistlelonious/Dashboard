import { assert, expect, test } from "vitest"
import { domains } from "./domains/index.ts"
import { feePresets } from "./fees.ts"
import { estimateTotals, laborBudget, priceForMinutes, stageBudgets, type PricingInputs } from "./pricing.ts"

const [shopifyOnline, , etsy, cashOrDirect] = feePresets
const skirtCosts = { materials: 3200, overhead: 500, wage: 2000, margin: 20 }
const pieCosts = { materials: 1400, overhead: 300, wage: 2000, margin: 20 }
const shopifySkirt = { ...skirtCosts, price: 8500, fee: shopifyOnline }
const cashPie = { ...pieCosts, price: 3200, fee: cashOrDirect }

function totalMinutes(inputs: PricingInputs): number {
  const result = laborBudget(inputs)
  assert(result.kind === "fits", `expected the labor budget to fit, got ${result.kind}`)
  return result.totalMinutes
}

function sumOfBudgets(budgets: { budgetMinutes: number }[]): number {
  return budgets.reduce((sum, stage) => sum + stage.budgetMinutes, 0)
}

test.each([
  {
    title: "skirt on Shopify",
    inputs: shopifySkirt,
    amounts: { fees: 277, profitTarget: 1700, laborBudget: 2823 },
    minutes: "84.7",
  },
  {
    title: "skirt on Etsy",
    inputs: { ...skirtCosts, price: 8500, fee: etsy },
    amounts: { fees: 853, profitTarget: 1700, laborBudget: 2247 },
    minutes: "67.4",
  },
  {
    title: "apple pie, cash",
    inputs: cashPie,
    amounts: { fees: 0, profitTarget: 640, laborBudget: 860 },
    minutes: "25.8",
  },
])("$title: labor budget $amounts.laborBudget cents, $minutes minutes", ({ inputs, amounts, minutes }) => {
  expect(laborBudget(inputs)).toMatchObject({ kind: "fits", ...amounts })
  expect(totalMinutes(inputs).toFixed(1)).toBe(minutes)
})

test.each([
  { title: "skirt on Shopify", fee: shopifyOnline, price: 20402 },
  { title: "skirt on Etsy", fee: etsy, price: 22333 },
])("$title, reverse: 6 hours of labor prices it at $price cents", ({ fee, price }) => {
  expect(priceForMinutes({ ...skirtCosts, fee }, 360)).toBe(price)
})

test("Etsy at a 42.5% margin: $72.54 of costs over the 48% kept is $151.125, which rounds up", () => {
  expect(priceForMinutes({ materials: 2709, overhead: 500, wage: 2000, margin: 42.5, fee: etsy }, 120)).toBe(15113)
})

test("skirt estimate: labor $53.00, tax $8.93, total $93.93, deposit $46.97, balance $46.96", () => {
  expect(
    estimateTotals({ price: 8500, materials: 3200, taxRate: 10.5, taxable: domains.sewing.taxable, depositPct: 50 }),
  ).toStrictEqual({ labor: 5300, subtotal: 8500, tax: 893, total: 9393, deposit: 4697, balance: 4696 })
})

test("pie estimate: labor $18.00, no tax, total $32.00, deposit $16.00, balance $16.00", () => {
  expect(
    estimateTotals({ price: 3200, materials: 1400, taxRate: 10.5, taxable: domains.pie.taxable, depositPct: 50 }),
  ).toStrictEqual({ labor: 1800, subtotal: 3200, tax: 0, total: 3200, deposit: 1600, balance: 1600 })
})

test("a $30 skirt on Shopify is short, with a $48.38 break-even price", () => {
  expect(laborBudget({ ...skirtCosts, price: 3000, fee: shopifyOnline })).toStrictEqual({
    kind: "short",
    fees: 117,
    profitTarget: 600,
    breakEvenPrice: 4838,
  })
})

test("a skirt priced at exactly break-even has a zero labor budget, which is still short", () => {
  expect(laborBudget({ ...skirtCosts, price: 4838, fee: shopifyOnline })).toMatchObject({ kind: "short" })
})

test("the Shopify skirt's stages share 84.7 minutes and aim 15% under their budgets", () => {
  const { stages, allowancePct } = domains.sewing
  const budgets = stageBudgets(totalMinutes(shopifySkirt), stages, allowancePct)
  expect(
    budgets.map((stage) => [stage.name, stage.budgetMinutes.toFixed(1), stage.aimForMinutes.toFixed(1)]),
  ).toStrictEqual([
    ["Cut", "16.9", "14.7"],
    ["Sew", "38.1", "33.1"],
    ["Fit", "12.7", "11.0"],
    ["Finish", "16.9", "14.7"],
  ])
})

test("the Shopify skirt's stage budgets add up to its 84.7 minutes", () => {
  const { stages, allowancePct } = domains.sewing
  expect(sumOfBudgets(stageBudgets(totalMinutes(shopifySkirt), stages, allowancePct))).toBeCloseTo(84.69, 9)
})

test("a skirt without Fit spreads all 84.7 minutes over Cut, Sew, and Finish", () => {
  const withoutFit = domains.sewing.stages.filter((stage) => stage.name !== "Fit")
  const budgets = stageBudgets(totalMinutes(shopifySkirt), withoutFit, domains.sewing.allowancePct)
  expect(budgets.map((stage) => stage.name)).toStrictEqual(["Cut", "Sew", "Finish"])
  expect(sumOfBudgets(budgets)).toBeCloseTo(84.69, 9)
})

test("the cash apple pie's 25.8 minutes split 7.7, 6.5, 5.2, 2.6, and 3.9", () => {
  const { stages, allowancePct } = domains.pie
  const budgets = stageBudgets(totalMinutes(cashPie), stages, allowancePct)
  expect(budgets.map((stage) => stage.budgetMinutes.toFixed(1))).toStrictEqual(["7.7", "6.5", "5.2", "2.6", "3.9"])
})
