import { expect, test } from "vitest"
import { formatCents, percentOf, roundHalfUp, toCents } from "./money.ts"

test.each([
  [892.5, 893],
  [4696.5, 4697],
  [246.5, 247],
  [892.4, 892],
  [892.6, 893],
])("roundHalfUp(%d) is %d", (cents, rounded) => {
  expect(roundHalfUp(cents)).toBe(rounded)
})

test("percentOf rounds the half cent in $5.00 at 2.9% up", () => {
  expect(percentOf(500, 2.9)).toBe(15)
})

test.each([
  ["85", 8500],
  ["85.5", 8550],
  ["$1,234.56", 123456],
  ["0.29", 29],
  ["12.05", 1205],
  [" 40 ", 4000],
])("toCents(%j) is %d cents", (text, cents) => {
  expect(toCents(text)).toStrictEqual({ ok: true, cents })
})

test.each(["abc", "", "-5", "1.234", "85.", "12,34", "$"])("toCents rejects %j", (text) => {
  expect(toCents(text)).toStrictEqual({ ok: false })
})

test.each([
  [123456, "$1,234.56"],
  [8500, "$85.00"],
  [5, "$0.05"],
  [0, "$0.00"],
])("formatCents(%d) is %s", (cents, text) => {
  expect(formatCents(cents)).toBe(text)
})
