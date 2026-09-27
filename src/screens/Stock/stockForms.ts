import { toCents } from "../../money.ts"
import type { DomainId } from "../../pricing/domains/index.ts"
import { convert, isUnit, units, type CrossConversion } from "../../inventory/units.ts"
import type { InventoryItem } from "../../storage/db.ts"
import type { NewPurchase } from "../../storage/store.ts"

export type PurchaseForm = {
  item: string
  category: string
  domain: DomainId
  unit: string
  conversion: string
  qty: string
  total: string
  vendor: string
  date: string
}

export type AdjustForm = { item: string; qty: string; unit: string; date: string }

export type Errors<Form> = Partial<Record<keyof Form, string>>

type Parsed<Value, Form> = { ok: true; value: Value } | { ok: false; errors: Errors<Form> }

export function matchItem(items: InventoryItem[], name: string): InventoryItem | undefined {
  const wanted = name.trim().toLowerCase()
  return items.find((item) => item.name.toLowerCase() === wanted)
}

function inList(words: string[]): string {
  return words.length < 3 ? words.join(" or ") : `${words.slice(0, -1).join(", ")}, or ${words.at(-1)}`
}

function unitsFor(item: Pick<InventoryItem, "unit" | "crossConversion">): string[] {
  return Object.keys(units).filter((unit) => convert(1, unit, item.unit, item).ok)
}

function quantity(text: string): number | undefined {
  const trimmed = text.trim()
  return /^\d+(\.\d+)?$/.test(trimmed) && Number(trimmed) > 0 ? Number(trimmed) : undefined
}

function isDate(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text))
}

const conversionPattern = /^1\s*([a-z]+(?: [a-z]+)?)\s*=\s*(\d+(?:\.\d+)?)\s*([a-z]+(?: [a-z]+)?)$/

function parseConversion(text: string, itemUnit: string): CrossConversion | string {
  const match = conversionPattern.exec(text.trim().toLowerCase())
  if (match === null) return "Write it like 1 cup = 4.25 oz"
  const [, from, factorText, to] = match
  const factor = Number(factorText)
  if (!isUnit(from) || !isUnit(to) || factor <= 0) return "Write it like 1 cup = 4.25 oz"
  const families = [units[from].family, units[to].family]
  if (!isUnit(itemUnit) || families[0] === families[1] || !families.includes(units[itemUnit].family)) {
    return `Use one unit like ${itemUnit} and one of another kind, like 1 cup = 4.25 oz`
  }
  return { from, to, factor }
}

export function parsePurchase(form: PurchaseForm, items: InventoryItem[]): Parsed<NewPurchase, PurchaseForm> {
  const errors: Errors<PurchaseForm> = {}
  const existing = matchItem(items, form.item)
  const unit = form.unit.trim() === "" && existing !== undefined ? existing.unit : form.unit.trim()
  const name = form.item.trim()
  let crossConversion: CrossConversion | undefined

  if (name === "") errors.item = "Enter an item, like Bemberg lining"
  if (existing === undefined) {
    if (form.category.trim() === "") errors.category = "Enter a category, like Fabric"
    if (!isUnit(unit)) errors.unit = "Use a unit like yd, lb, cup, or each"
    if (form.conversion.trim() !== "" && isUnit(unit)) {
      const parsed = parseConversion(form.conversion, unit)
      if (typeof parsed === "string") errors.conversion = parsed
      else crossConversion = parsed
    }
  } else if (!convert(1, unit, existing.unit, existing).ok) {
    errors.unit = `Use ${inList(unitsFor(existing))}`
  }

  const qty = quantity(form.qty)
  if (qty === undefined) errors.qty = "Use a number above 0, like 1.5"
  const total = toCents(form.total)
  if (!total.ok) errors.total = "Use an amount, like 6.00"
  const vendor = form.vendor.trim()
  if (vendor === "") errors.vendor = "Enter where you bought it, like JOANN"
  if (!isDate(form.date.trim())) errors.date = "Use a date like 2026-09-27"

  if (Object.keys(errors).length > 0 || qty === undefined || !total.ok) return { ok: false, errors }
  const item: NewPurchase["item"] =
    existing === undefined
      ? {
          create: {
            name,
            category: form.category.trim(),
            domain: form.domain,
            unit,
            ...(crossConversion === undefined ? {} : { crossConversion }),
          },
        }
      : { existing: existing.id }
  return { ok: true, value: { item, vendor, date: form.date.trim(), qty, unit, landedCost: total.cents } }
}

export type NewUse = { itemId: string; date: string; qty: number; unit: string }

export function parseAdjust(form: AdjustForm, items: InventoryItem[]): Parsed<NewUse, AdjustForm> {
  const errors: Errors<AdjustForm> = {}
  const item = matchItem(items, form.item)
  const unit = form.unit.trim() === "" && item !== undefined ? item.unit : form.unit.trim()
  if (item === undefined) errors.item = "Pick an item from the list above"
  else if (!convert(1, unit, item.unit, item).ok) errors.unit = `Use ${inList(unitsFor(item))}`
  const qty = quantity(form.qty)
  if (qty === undefined) errors.qty = "Use a number above 0, like 1.5"
  if (!isDate(form.date.trim())) errors.date = "Use a date like 2026-09-27"
  if (item === undefined || qty === undefined || Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { itemId: item.id, date: form.date.trim(), qty, unit } }
}
