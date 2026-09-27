import { assert, expect, test } from "vitest"
import { domains, type Domain } from "../../pricing/domains/index.ts"
import { feePresets } from "../../pricing/fees.ts"
import type { Project } from "../../storage/db.ts"
import {
  calculate,
  formFor,
  parsedProjectInputs,
  withStage,
  type CalculatorForm,
  type CalculatorResult,
} from "./calculator.ts"

const [shopifyOnline, , etsy, cashOrDirect] = feePresets

const shopifySkirt: CalculatorForm = {
  domain: "sewing",
  mode: "time",
  fee: shopifyOnline,
  stages: domains.sewing.stages,
  price: "85",
  minutes: "",
  materials: "32",
  overhead: "5",
  wage: "20.00",
  margin: "20",
  batchSize: "",
}

const cashPie: CalculatorForm = {
  ...shopifySkirt,
  domain: "pie",
  stages: domains.pie.stages,
  fee: cashOrDirect,
  price: "32",
  materials: "14",
  overhead: "3",
}

function timed(result: CalculatorResult) {
  assert(result.kind === "time" || result.kind === "price", `expected stage times, got ${result.kind}`)
  return {
    total: result.totalMinutes.toFixed(1),
    totalAimFor: result.totalAimForMinutes.toFixed(1),
    rows: result.stages.map((stage) => [
      stage.name,
      stage.icon,
      stage.budgetMinutes.toFixed(1),
      stage.aimForMinutes.toFixed(1),
      stage.perUnitMinutes?.toFixed(1),
    ]),
  }
}

test("the $85 Shopify skirt gets 84.7 minutes split over its four stages with icons", () => {
  const result = calculate(shopifySkirt)
  expect(result).toMatchObject({ kind: "time", fees: 277, profitTarget: 1700, laborBudget: 2823 })
  expect(timed(result)).toStrictEqual({
    total: "84.7",
    totalAimFor: "73.6",
    rows: [
      ["Cut", "scissors", "16.9", "14.7", undefined],
      ["Sew", "needle", "38.1", "33.1", undefined],
      ["Fit", "tape", "12.7", "11.0", undefined],
      ["Finish", "hanger", "16.9", "14.7", undefined],
    ],
  })
})

test("the same skirt on Etsy gets 67.4 minutes", () => {
  expect(timed(calculate({ ...shopifySkirt, fee: etsy })).total).toBe("67.4")
})

test("360 minutes prices the skirt at $204.02 on Shopify and $223.33 on Etsy", () => {
  const priceFromTime: CalculatorForm = { ...shopifySkirt, mode: "price", price: "", minutes: "360" }
  expect(calculate(priceFromTime)).toMatchObject({ kind: "price", price: 20402, fees: 622, profitTarget: 4080 })
  expect(calculate({ ...priceFromTime, fee: etsy })).toMatchObject({ kind: "price", price: 22333 })
  expect(timed(calculate(priceFromTime)).rows.map((row) => row[2])).toStrictEqual(["72.0", "162.0", "54.0", "72.0"])
})

test("price from time ignores whatever sits in the price field", () => {
  const result = calculate({ ...shopifySkirt, mode: "price", price: "abc", minutes: "360" })
  expect(result).toMatchObject({ kind: "price", price: 20402 })
})

test("the $32 cash pie gets 25.8 minutes split over five stages with no icons", () => {
  expect(timed(calculate(cashPie))).toStrictEqual({
    total: "25.8",
    totalAimFor: "23.5",
    rows: [
      ["Crust", undefined, "7.7", "7.0", undefined],
      ["Filling", undefined, "6.5", "5.9", undefined],
      ["Assembly and crimping", undefined, "5.2", "4.7", undefined],
      ["Baking (hands-on)", undefined, "2.6", "2.3", undefined],
      ["Cooling and packaging", undefined, "3.9", "3.5", undefined],
    ],
  })
})

test("a batch of 6 pies shows minutes per pie for the stages that are not batchable", () => {
  expect(timed(calculate({ ...cashPie, batchSize: "6" })).rows.map((row) => [row[0], row[4]])).toStrictEqual([
    ["Crust", undefined],
    ["Filling", undefined],
    ["Assembly and crimping", "0.9"],
    ["Baking (hands-on)", undefined],
    ["Cooling and packaging", "0.6"],
  ])
})

test("a batch size of 1 shows no minutes per unit", () => {
  const rows = timed(calculate({ ...shopifySkirt, batchSize: "1" })).rows
  expect(rows.map((row) => row[4])).toStrictEqual([undefined, undefined, undefined, undefined])
})

const [cut, sew, fit, finish] = domains.sewing.stages

test("a stage that is off hands its share to the others", () => {
  const rows = timed(calculate({ ...shopifySkirt, stages: [cut, sew, finish] })).rows
  expect(rows.map((row) => [row[0], row[2]])).toStrictEqual([
    ["Cut", "19.9"],
    ["Sew", "44.8"],
    ["Finish", "19.9"],
  ])
})

test("a $30 skirt is short and shows the $48.38 break-even price", () => {
  expect(calculate({ ...shopifySkirt, price: "30" })).toStrictEqual({
    kind: "short",
    fees: 117,
    profitTarget: 600,
    breakEvenPrice: 4838,
  })
})

test("abc as the price marks only the price field", () => {
  expect(calculate({ ...shopifySkirt, price: "abc" })).toStrictEqual({
    kind: "invalid",
    errors: { price: "Use a number, like 85.00" },
  })
})

test("every bad field gets its own message at once", () => {
  const result = calculate({
    ...shopifySkirt,
    materials: "lots",
    overhead: "-5",
    wage: "twenty",
    margin: "x",
    batchSize: "2.5",
  })
  expect(result).toStrictEqual({
    kind: "invalid",
    errors: {
      materials: "Use a number, like 85.00",
      overhead: "Use a number, like 85.00",
      wage: "Use a number, like 85.00",
      margin: "Use a number, like 20",
      batchSize: "Use a whole number, like 6",
    },
  })
})

test("bad minutes mark the minutes field in price from time", () => {
  expect(calculate({ ...shopifySkirt, mode: "price", minutes: "an hour" })).toStrictEqual({
    kind: "invalid",
    errors: { minutes: "Use a number, like 90" },
  })
})

test.each(["0", "0.00", "$0"])("a wage of %j is invalid", (wage) => {
  expect(calculate({ ...shopifySkirt, wage })).toStrictEqual({
    kind: "invalid",
    errors: { wage: "Use a wage above 0, like 20.00" },
  })
})

test("an empty wage or margin is invalid, not zero", () => {
  expect(calculate({ ...shopifySkirt, wage: "", margin: "" })).toStrictEqual({
    kind: "invalid",
    errors: { wage: "Use a number, like 85.00", margin: "Use a number, like 20" },
  })
})

test("fees and margin that reach 100% mark the margin field", () => {
  expect(calculate({ ...shopifySkirt, fee: etsy, margin: "90.5" })).toStrictEqual({
    kind: "invalid",
    errors: { margin: "Keep fees and margin under 100%" },
  })
  expect(calculate({ ...shopifySkirt, fee: cashOrDirect, margin: "100" })).toStrictEqual({
    kind: "invalid",
    errors: { margin: "Keep fees and margin under 100%" },
  })
  expect(calculate({ ...shopifySkirt, fee: etsy, margin: "90.49" }).kind).not.toBe("invalid")
})

test("a batch size of 0 is invalid", () => {
  expect(calculate({ ...shopifySkirt, batchSize: "0" })).toStrictEqual({
    kind: "invalid",
    errors: { batchSize: "Use a whole number, like 6" },
  })
})

test("an empty price, or empty minutes in price from time, is incomplete", () => {
  expect(calculate({ ...shopifySkirt, price: "" })).toStrictEqual({ kind: "incomplete" })
  expect(calculate({ ...shopifySkirt, mode: "price", minutes: " " })).toStrictEqual({ kind: "incomplete" })
})

test("the starting form is incomplete, not invalid", () => {
  const start: CalculatorForm = {
    domain: "sewing",
    mode: "time",
    fee: cashOrDirect,
    stages: domains.sewing.stages,
    price: "",
    minutes: "",
    materials: "",
    overhead: "",
    wage: "20.00",
    margin: "20",
    batchSize: "",
  }
  expect(calculate(start)).toStrictEqual({ kind: "incomplete" })
})

test("empty materials and overhead count as $0", () => {
  const withCosts = calculate({ ...shopifySkirt, materials: "0", overhead: "0" })
  const empty = calculate({ ...shopifySkirt, materials: "", overhead: "" })
  expect(empty).toStrictEqual(withCosts)
  expect(empty).toMatchObject({ kind: "time", laborBudget: 6523 })
})

test("only sewing's Fit stage is marked removable", () => {
  const all: Domain[] = Object.values(domains)
  const removable = all.flatMap((domain) =>
    domain.stages.filter((stage) => stage.removable === true).map((stage) => `${domain.id} ${stage.name}`),
  )
  expect(removable).toEqual(["sewing Fit"])
})

test("Fit added back returns to its place between Sew and Finish", () => {
  expect(withStage([cut, sew, finish], fit, domains.sewing.stages)).toStrictEqual([cut, sew, fit, finish])
})

const savedSkirt: Project = {
  id: "p1",
  updatedAt: "2026-09-27T10:00:00.000Z",
  domain: "sewing",
  name: "Lined skirt",
  hue: "plum",
  price: 8500,
  batchSize: 1,
  fee: shopifyOnline,
  materials: [{ kind: "fixed", name: "Materials", cost: 3200 }],
  overhead: 500,
  wage: 2000,
  margin: 20,
  stages: [cut, sew, finish],
  firstBuild: true,
  built: false,
  timeLogs: [],
}

test("a saved project loads into the form as typed text, with batch size 1 left blank", () => {
  expect(formFor(savedSkirt)).toStrictEqual({
    domain: "sewing",
    mode: "time",
    fee: shopifyOnline,
    stages: [cut, sew, finish],
    price: "85.00",
    minutes: "",
    materials: "32.00",
    overhead: "5.00",
    wage: "20.00",
    margin: "20",
    batchSize: "",
  })
})

test("a new project's zero price, no materials, and zero overhead load as blank fields", () => {
  const fresh = formFor({ ...savedSkirt, price: 0, materials: [], overhead: 0, margin: 12.5, batchSize: 6, wage: 1805 })
  expect(fresh).toMatchObject({ price: "", materials: "", overhead: "", margin: "12.5", batchSize: "6", wage: "18.05" })
})

test("the form saves every input, with materials as one fixed line", () => {
  expect(parsedProjectInputs(shopifySkirt)).toStrictEqual({
    fee: shopifyOnline,
    stages: domains.sewing.stages,
    price: 8500,
    materials: [{ kind: "fixed", name: "Materials", cost: 3200 }],
    overhead: 500,
    wage: 2000,
    margin: 20,
    batchSize: 1,
  })
})

test("blank money fields save as 0 and a blank batch size as 1", () => {
  expect(parsedProjectInputs({ ...shopifySkirt, price: "", materials: "", overhead: "", batchSize: "" })).toMatchObject({
    price: 0,
    materials: [{ kind: "fixed", name: "Materials", cost: 0 }],
    overhead: 0,
    batchSize: 1,
  })
})

test("a field that doesn't parse is left out, so the project keeps its last good value", () => {
  const inputs = parsedProjectInputs({ ...shopifySkirt, price: "abc", wage: "", margin: "99", batchSize: "0" })
  expect(Object.keys(inputs).sort()).toEqual(["fee", "materials", "overhead", "stages"])
})

test("saving then loading gives back the same form and result", () => {
  const form: CalculatorForm = { ...shopifySkirt, batchSize: "3", stages: [cut, sew, finish] }
  const reloaded = formFor({ ...savedSkirt, ...parsedProjectInputs(form) })
  expect(reloaded).toStrictEqual({ ...form, price: "85.00", materials: "32.00", overhead: "5.00" })
  expect(calculate(reloaded)).toStrictEqual(calculate(form))
})
