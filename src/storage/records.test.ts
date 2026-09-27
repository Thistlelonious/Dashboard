import { expect, test } from "vitest"
import { live, newRecord, softDelete, touch } from "./records.ts"

const created = "2026-09-27T10:00:00.000Z"
const later = "2026-09-27T11:30:00.000Z"

test("newRecord keeps the fields, stamps the given time, and gives each record its own id", () => {
  const first = newRecord({ text: "Order business cards", done: false }, created)
  const second = newRecord({ text: "Order business cards", done: false }, created)
  expect(first).toStrictEqual({ text: "Order business cards", done: false, id: first.id, updatedAt: created })
  expect(first.id).not.toBe(second.id)
})

test("touch sets updatedAt to the given time and keeps every other field", () => {
  const record = { id: "a", updatedAt: created, text: "Hem", done: true }
  expect(touch(record, later)).toStrictEqual({ id: "a", updatedAt: later, text: "Hem", done: true })
  expect(record.updatedAt).toBe(created)
})

test("softDelete sets deletedAt and updatedAt to the given time", () => {
  const record = { id: "a", updatedAt: created, text: "Hem" }
  expect(softDelete(record, later)).toStrictEqual({ id: "a", updatedAt: later, deletedAt: later, text: "Hem" })
  expect(record).toStrictEqual({ id: "a", updatedAt: created, text: "Hem" })
})

test("live drops deleted records and keeps the rest in order", () => {
  const records = [
    { id: "c", updatedAt: created },
    { id: "b", updatedAt: created, deletedAt: later },
    { id: "a", updatedAt: created },
    { id: "d", updatedAt: created, deletedAt: later },
  ]
  expect(live(records).map((record) => record.id)).toEqual(["c", "a"])
})
