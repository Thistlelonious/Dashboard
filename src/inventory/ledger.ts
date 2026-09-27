import type { InventoryItem, Purchase, StockUse } from "../storage/db.ts"
import { live } from "../storage/records.ts"
import { convert } from "./units.ts"

export type Stock = {
  qty: number
  /** Cents per item unit, unrounded. It is null until the first purchase. */
  averageCost: number | null
  short: boolean
}

type Entry = { item: InventoryItem; qty: number; value: number; averageCost: number | null }

type Event = { kind: "purchase"; record: Purchase } | { kind: "use"; record: StockUse }

function inItemUnit(item: InventoryItem, record: Purchase | StockUse): number {
  const converted = convert(record.qty, record.unit, item.unit, item)
  if (!converted.ok) throw new Error(`${record.id}: ${converted.message}`)
  return converted.qty
}

function byDateThenEdit(a: Event, b: Event): number {
  return a.record.date.localeCompare(b.record.date) || a.record.updatedAt.localeCompare(b.record.updatedAt)
}

export function replay(items: InventoryItem[], purchases: Purchase[], uses: StockUse[]): Map<string, Stock> {
  const stock = new Map<string, Entry>(live(items).map((item) => [item.id, { item, qty: 0, value: 0, averageCost: null }]))
  const events: Event[] = [
    ...live(purchases).map((record) => ({ kind: "purchase" as const, record })),
    ...live(uses).map((record) => ({ kind: "use" as const, record })),
  ].sort(byDateThenEdit)

  for (const event of events) {
    const entry = stock.get(event.record.itemId)
    if (entry === undefined) continue
    const qty = inItemUnit(entry.item, event.record)
    if (event.kind === "purchase") {
      const covered = entry.qty < 0 ? entry.qty * (event.record.landedCost / qty) : entry.value
      entry.qty += qty
      entry.value = covered + event.record.landedCost
      entry.averageCost = entry.qty > 0 ? entry.value / entry.qty : event.record.landedCost / qty
    } else {
      entry.qty -= qty
      entry.value -= qty * (entry.averageCost ?? 0)
    }
  }

  return new Map([...stock].map(([id, { qty, averageCost }]) => [id, { qty, averageCost, short: qty < 0 }]))
}
