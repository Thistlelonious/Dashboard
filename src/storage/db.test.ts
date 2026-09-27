import "fake-indexeddb/auto"
import { IDBFactory } from "fake-indexeddb"
import { assert, beforeEach, expect, test } from "vitest"
import { openDb, type Project } from "./db.ts"
import { newRecord, touch, type Saved } from "./records.ts"

const beforeAnyEdit = "2026-09-26T00:00:00.000Z"
const editedAt = "2026-09-27T09:00:00.000Z"

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

test("opening twice leaves four checklist items and one settings record", async () => {
  const first = await openDb()
  first.close()
  const db = await openDb()
  expect(await db.getAllKeys("checklist")).toEqual([
    "seed-cottage-food",
    "seed-resale-certificate",
    "seed-sellers-permit",
    "seed-shopify-plan",
  ])
  expect(await db.getAllKeys("settings")).toEqual(["settings"])
})

test("first open seeds the PLAN.md checklist and the default settings at the fixed seed time", async () => {
  const db = await openDb()
  expect(await db.getAll("checklist")).toStrictEqual([
    {
      id: "seed-cottage-food",
      text: "Register as a Class A cottage food operation with LA County Public Health, Environmental Health.",
      why: "Required before selling pies. The 2026 sales cap is $88,878.",
      updatedAt: beforeAnyEdit,
      done: false,
      seeded: true,
    },
    {
      id: "seed-resale-certificate",
      text: "Give fabric suppliers a California resale certificate (CDTFA-230).",
      why: "With a seller's permit, materials that become part of items you sell can be bought without sales tax. That lowers the landed cost of fabric, thread, and zippers.",
      updatedAt: beforeAnyEdit,
      done: false,
      seeded: true,
    },
    {
      id: "seed-sellers-permit",
      text: "Get a California seller's permit from CDTFA.",
      why: "Required before selling garments, which are taxable.",
      updatedAt: beforeAnyEdit,
      done: false,
      seeded: true,
    },
    {
      id: "seed-shopify-plan",
      text: "Confirm your Shopify plan and card rate in Shopify admin.",
      why: "The fee presets assume the Basic plan.",
      updatedAt: beforeAnyEdit,
      done: false,
      seeded: true,
    },
  ])
  expect(await db.get("settings", "settings")).toStrictEqual({
    updatedAt: beforeAnyEdit,
    businessName: "",
    taxRate: 10.5,
    depositPct: 50,
    estimateValidDays: 30,
  })
})

test("a ticked seeded item and a changed tax rate survive reopening", async () => {
  const db = await openDb()
  const permit = await db.get("checklist", "seed-sellers-permit")
  const settings = await db.get("settings", "settings")
  assert(permit !== undefined && settings !== undefined, "first open seeded both records")
  await db.put("checklist", { ...touch(permit, editedAt), done: true })
  await db.put("settings", { ...settings, updatedAt: editedAt, taxRate: 9.5 }, "settings")
  db.close()

  const reopened = await openDb()
  expect(await reopened.get("checklist", "seed-sellers-permit")).toMatchObject({ done: true, updatedAt: editedAt })
  expect(await reopened.get("settings", "settings")).toMatchObject({ taxRate: 9.5, updatedAt: editedAt })
})

test("the coinvoice database is version 1, keys projects and checklist by id, and keeps settings under one key", async () => {
  const db = await openDb()
  expect(db.name).toBe("coinvoice")
  expect(db.version).toBe(1)
  expect([...db.objectStoreNames]).toEqual(["checklist", "projects", "settings"])
  const tx = db.transaction(["projects", "checklist", "settings"])
  expect(tx.objectStore("projects").keyPath).toBe("id")
  expect(tx.objectStore("checklist").keyPath).toBe("id")
  expect(tx.objectStore("settings").keyPath).toBeNull()

  const skirt = newRecord(
    {
      domain: "sewing",
      name: "Lined skirt",
      hue: "plum",
      price: 8500,
      batchSize: 1,
      fee: { name: "Shopify online", pct: 2.9, fixed: 30 },
      materials: [{ kind: "fixed", name: "Materials", cost: 1800 }],
      overhead: 0,
      wage: 2000,
      margin: 20,
      stages: [{ name: "Cut", weight: 20, waitMin: 0, batchable: false, icon: "scissors" }],
      firstBuild: true,
      built: false,
      timeLogs: [],
    } satisfies Omit<Project, keyof Saved>,
    editedAt,
  )
  await db.put("projects", skirt)
  expect(await db.get("projects", skirt.id)).toStrictEqual(skirt)
})
