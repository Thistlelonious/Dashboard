import { expect, test } from "vitest"
import type { InventoryItem, Purchase, StockUse } from "../storage/db.ts"
import { replay } from "./ledger.ts"

const at = "2026-09-27T09:00:00.000Z"

const lining: InventoryItem = { id: "lining", updatedAt: at, name: "Bemberg lining", category: "Fabric", domain: "sewing", unit: "yd" }

function bought(id: string, date: string, qty: number, landedCost: number, fields: Partial<Purchase> = {}): Purchase {
  return { id, updatedAt: at, itemId: "lining", receiptId: `manual-${id}`, date, vendor: "JOANN", qty, unit: "yd", landedCost, ...fields }
}

function used(id: string, date: string, qty: number, fields: Partial<StockUse> = {}): StockUse {
  return { id, updatedAt: at, itemId: "lining", date, qty, unit: "yd", reason: "adjustment", ...fields }
}

test("PLAN.md average cost: 1 yd at $6.00 plus 2 yd for $15.00 is 3 yd at $7.00, and using 1 yd leaves 2 yd at $7.00", () => {
  const purchases = [bought("first", "2026-09-01", 1, 600), bought("second", "2026-09-10", 2, 1500)]
  expect(replay([lining], purchases, []).get("lining")).toStrictEqual({ qty: 3, averageCost: 700, short: false })
  expect(replay([lining], purchases, [used("waste", "2026-09-11", 1)]).get("lining")).toStrictEqual({
    qty: 2,
    averageCost: 700,
    short: false,
  })
})

test("a use between two purchases is costed from the first purchase only", () => {
  const purchases = [bought("second", "2026-09-10", 2, 1500), bought("first", "2026-09-01", 1, 600)]
  expect(replay([lining], purchases, [used("waste", "2026-09-05", 1)]).get("lining")).toStrictEqual({
    qty: 2,
    averageCost: 750,
    short: false,
  })
})

test("events on the same date run in the order they were entered", () => {
  const purchases = [bought("first", "2026-09-01", 1, 600, { updatedAt: "2026-09-01T09:00:00.000Z" })]
  const uses = [used("waste", "2026-09-01", 1, { updatedAt: "2026-09-01T08:00:00.000Z" })]
  expect(replay([lining], purchases, uses).get("lining")).toStrictEqual({ qty: 0, averageCost: 600, short: false })
  expect(replay([lining], [...purchases, bought("again", "2026-09-02", 1, 800)], uses).get("lining")).toStrictEqual({
    qty: 1,
    averageCost: 800,
    short: false,
  })
})

test("using more than is on hand is flagged, and the next purchase covers the shortfall at its own price", () => {
  const purchases = [bought("first", "2026-09-01", 1, 600)]
  const uses = [used("waste", "2026-09-02", 2)]
  expect(replay([lining], purchases, uses).get("lining")).toStrictEqual({ qty: -1, averageCost: 600, short: true })
  expect(replay([lining], [...purchases, bought("again", "2026-09-03", 2, 1600)], uses).get("lining")).toStrictEqual({
    qty: 1,
    averageCost: 800,
    short: false,
  })
})

test("quantities in other units count in the item's unit, and deleted records don't count", () => {
  const purchases = [bought("inches", "2026-09-01", 36, 600, { unit: "in" }), bought("gone", "2026-09-02", 5, 100, { deletedAt: at })]
  expect(replay([lining], purchases, [used("half", "2026-09-03", 18, { unit: "in" })]).get("lining")).toStrictEqual({
    qty: 0.5,
    averageCost: 600,
    short: false,
  })
})

test("an item with no purchases has no average cost yet", () => {
  expect(replay([lining], [], []).get("lining")).toStrictEqual({ qty: 0, averageCost: null, short: false })
})
