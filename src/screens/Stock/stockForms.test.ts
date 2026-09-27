import { expect, test } from "vitest"
import type { InventoryItem } from "../../storage/db.ts"
import { formatQty, formatUnitCost } from "./format.ts"
import { parseAdjust, parsePurchase, type PurchaseForm } from "./stockForms.ts"

const lining: InventoryItem = {
  id: "lining",
  updatedAt: "2026-09-27T09:00:00.000Z",
  name: "Bemberg lining",
  category: "Fabric",
  domain: "sewing",
  unit: "yd",
}

const blank: PurchaseForm = {
  item: "",
  category: "",
  domain: "sewing",
  unit: "",
  conversion: "",
  qty: "",
  total: "",
  vendor: "",
  date: "2026-09-27",
}

test("a purchase of a new item creates it", () => {
  const form = { ...blank, item: " Bemberg lining ", category: "Fabric", unit: "yd", qty: "1", total: "6.00", vendor: "JOANN" }
  expect(parsePurchase(form, [])).toStrictEqual({
    ok: true,
    value: {
      item: { create: { name: "Bemberg lining", category: "Fabric", domain: "sewing", unit: "yd" } },
      vendor: "JOANN",
      date: "2026-09-27",
      qty: 1,
      unit: "yd",
      landedCost: 600,
    },
  })
})

test("a name that matches an item, ignoring case, adds to that item in any unit it converts from", () => {
  const form = { ...blank, item: "bemberg LINING", unit: "in", qty: "72", total: "$15", vendor: "JOANN" }
  expect(parsePurchase(form, [lining])).toMatchObject({ ok: true, value: { item: { existing: "lining" }, qty: 72, unit: "in" } })
  expect(parsePurchase({ ...form, unit: "lb" }, [lining])).toStrictEqual({ ok: false, errors: { unit: "Use yd, in, m, or cm" } })
  expect(parsePurchase({ ...form, unit: "", qty: "2" }, [lining])).toMatchObject({ ok: true, value: { qty: 2, unit: "yd" } })
})

test("a new item can carry a conversion to another kind of unit", () => {
  const form = { ...blank, item: "Flour, all-purpose", category: "Baking", domain: "pie" as const, unit: "lb", qty: "5", total: "3.90", vendor: "Smart & Final" }
  expect(parsePurchase({ ...form, conversion: "1 cup = 4.25 oz" }, [])).toMatchObject({
    ok: true,
    value: { item: { create: { crossConversion: { from: "cup", to: "oz", factor: 4.25 } } } },
  })
  expect(parsePurchase({ ...form, conversion: "a cup is 4 oz" }, [])).toStrictEqual({
    ok: false,
    errors: { conversion: "Write it like 1 cup = 4.25 oz" },
  })
  expect(parsePurchase({ ...form, conversion: "1 yd = 36 in" }, [])).toStrictEqual({
    ok: false,
    errors: { conversion: "Use one unit like lb and one of another kind, like 1 cup = 4.25 oz" },
  })
})

test("every missing or broken field gets its own message", () => {
  expect(parsePurchase({ ...blank, date: "Sept 27" }, [])).toStrictEqual({
    ok: false,
    errors: {
      item: "Enter an item, like Bemberg lining",
      category: "Enter a category, like Fabric",
      unit: "Use a unit like yd, lb, cup, or each",
      qty: "Use a number above 0, like 1.5",
      total: "Use an amount, like 6.00",
      vendor: "Enter where you bought it, like JOANN",
      date: "Use a date like 2026-09-27",
    },
  })
})

test("an adjustment names an existing item and a unit it converts from", () => {
  const form = { item: "Bemberg lining", qty: "1", unit: "yd", date: "2026-09-27" }
  expect(parseAdjust(form, [lining])).toStrictEqual({
    ok: true,
    value: { itemId: "lining", date: "2026-09-27", qty: 1, unit: "yd" },
  })
  expect(parseAdjust({ ...form, unit: "" }, [lining])).toMatchObject({ ok: true, value: { unit: "yd" } })
  expect(parseAdjust({ ...form, item: "Silk" }, [lining])).toStrictEqual({
    ok: false,
    errors: { item: "Pick an item from the list above" },
  })
  expect(parseAdjust({ ...form, qty: "0" }, [lining])).toStrictEqual({
    ok: false,
    errors: { qty: "Use a number above 0, like 1.5" },
  })
})

test("quantities and unit costs read the way PLAN.md writes them", () => {
  expect(formatQty(3, "yd")).toBe("3 yd")
  expect(formatQty(1 / 3, "yd")).toBe("0.333 yd")
  expect(formatUnitCost(700, "yd")).toBe("$7.00 per yard")
  expect(formatUnitCost(78, "lb")).toBe("$0.78 per pound")
  expect(formatUnitCost(49.5, "each")).toBe("$0.50 each")
})
