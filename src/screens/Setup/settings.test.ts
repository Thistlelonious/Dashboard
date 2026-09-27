import { expect, test } from "vitest"
import { settingFields, type SettingName } from "./settings.ts"

function parse(name: SettingName, text: string) {
  const field = settingFields.find((setting) => setting.name === name)
  if (field === undefined) throw new Error(`no ${name} field`)
  return field.parse(text)
}

test("each setting parses its typed text into its saved value", () => {
  expect(parse("businessName", "  Thimble Row ")).toStrictEqual({ ok: true, patch: { businessName: "Thimble Row" } })
  expect(parse("businessName", "")).toStrictEqual({ ok: true, patch: { businessName: "" } })
  expect(parse("taxRate", "9.25%")).toStrictEqual({ ok: true, patch: { taxRate: 9.25 } })
  expect(parse("depositPct", "100")).toStrictEqual({ ok: true, patch: { depositPct: 100 } })
  expect(parse("estimateValidDays", " 14 ")).toStrictEqual({ ok: true, patch: { estimateValidDays: 14 } })
})

test("a setting that doesn't parse says what to type instead", () => {
  expect(parse("taxRate", "ten")).toStrictEqual({ ok: false, message: "Use a number up to 100, like 10.5" })
  expect(parse("taxRate", "")).toStrictEqual({ ok: false, message: "Use a number up to 100, like 10.5" })
  expect(parse("depositPct", "100.01")).toStrictEqual({ ok: false, message: "Use a number up to 100, like 50" })
  expect(parse("estimateValidDays", "0")).toStrictEqual({ ok: false, message: "Use a whole number, like 30" })
  expect(parse("estimateValidDays", "7.5")).toStrictEqual({ ok: false, message: "Use a whole number, like 30" })
})
