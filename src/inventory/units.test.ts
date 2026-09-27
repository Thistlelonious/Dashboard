import { expect, test } from "vitest"
import { convert } from "./units.ts"

const plain = {}
const flour = { crossConversion: { from: "cup", to: "oz", factor: 4.25 } }

test("units convert within their family", () => {
  expect(convert(1.5, "yd", "in", plain)).toStrictEqual({ ok: true, qty: 54 })
  expect(convert(1, "lb", "oz", plain)).toStrictEqual({ ok: true, qty: 16 })
  expect(convert(1, "m", "cm", plain)).toStrictEqual({ ok: true, qty: 100 })
  expect(convert(1, "kg", "g", plain)).toStrictEqual({ ok: true, qty: 1000 })
  expect(convert(1, "cup", "tbsp", plain)).toStrictEqual({ ok: true, qty: 16 })
  expect(convert(1, "fl oz", "tsp", plain)).toStrictEqual({ ok: true, qty: 6 })
})

test("flour turns cups into ounces, and pounds into cups, through its cross conversion", () => {
  expect(convert(2, "cup", "oz", flour)).toStrictEqual({ ok: true, qty: 8.5 })
  expect(convert(4.25, "oz", "cup", flour)).toStrictEqual({ ok: true, qty: 1 })
  expect(convert(17, "lb", "cup", flour)).toStrictEqual({ ok: true, qty: 64 })
})

test("yards can't become pounds", () => {
  expect(convert(1, "yd", "lb", plain)).toStrictEqual({ ok: false, message: "yards can't be turned into pounds for this item" })
  expect(convert(1, "yd", "lb", flour)).toStrictEqual({ ok: false, message: "yards can't be turned into pounds for this item" })
})

test("an unknown unit is an error", () => {
  expect(convert(1, "bolt", "yd", plain)).toStrictEqual({ ok: false, message: "bolt isn't a unit coinvoice knows" })
})
