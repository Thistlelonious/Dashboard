import "fake-indexeddb/auto"
import { IDBFactory } from "fake-indexeddb"
import { openDB } from "idb"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { domains } from "../pricing/domains/index.ts"
import { openDb } from "./db.ts"
import { createStore, type Store } from "./store.ts"

let store: Store

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  store = createStore()
})

afterEach(async () => {
  vi.useRealTimers()
  await store.close()
})

function at(time: string) {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(time))
}

test("a new project starts from its domain with the cash preset, a $20.00 wage, and a 20% margin", async () => {
  at("2026-09-27T10:00:00.000Z")
  const skirt = await store.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  expect(await store.project(skirt.id)).toStrictEqual({
    id: skirt.id,
    updatedAt: "2026-09-27T10:00:00.000Z",
    domain: "sewing",
    name: "Lined skirt",
    hue: "plum",
    price: 0,
    batchSize: 1,
    fee: { name: "Cash or direct", pct: 0, fixed: 0 },
    materials: [],
    overhead: 0,
    wage: 2000,
    margin: 20,
    stages: domains.sewing.stages,
    firstBuild: true,
    built: false,
    timeLogs: [],
  })
})

test("projects list newest-updated first, and an update moves a project to the top", async () => {
  at("2026-09-27T10:00:00.000Z")
  const skirt = await store.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  at("2026-09-27T10:05:00.000Z")
  const pie = await store.createProject({ name: "Apple pie", domain: "pie", hue: "marigold" })
  expect((await store.projects()).map((project) => project.name)).toEqual(["Apple pie", "Lined skirt"])

  at("2026-09-27T10:10:00.000Z")
  await store.updateProject(skirt.id, { price: 8500 })
  expect((await store.projects()).map((project) => project.name)).toEqual(["Lined skirt", "Apple pie"])
  expect(await store.project(skirt.id)).toMatchObject({ price: 8500, updatedAt: "2026-09-27T10:10:00.000Z" })
  expect(await store.project(pie.id)).toMatchObject({ price: 0 })
})

test("an update keeps the fields it doesn't name, so a rename and a price save don't undo each other", async () => {
  const skirt = await store.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  await Promise.all([store.updateProject(skirt.id, { name: "Wrap skirt" }), store.updateProject(skirt.id, { price: 8500 })])
  expect(await store.project(skirt.id)).toMatchObject({ name: "Wrap skirt", price: 8500 })
})

test("a deleted project leaves the list and reads as missing, but stays stored with deletedAt", async () => {
  const skirt = await store.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  const pie = await store.createProject({ name: "Apple pie", domain: "pie", hue: "marigold" })
  at("2026-09-27T11:00:00.000Z")
  await store.deleteProject(skirt.id)
  expect((await store.projects()).map((project) => project.id)).toEqual([pie.id])
  expect(await store.project(skirt.id)).toBeNull()
  await store.close()
  const raw = await openDb()
  expect(await raw.get("projects", skirt.id)).toMatchObject({ deletedAt: "2026-09-27T11:00:00.000Z" })
  raw.close()
})

test("a settings change survives reopening the database", async () => {
  at("2026-09-27T12:00:00.000Z")
  await store.updateSettings({ businessName: "Thimble Row", taxRate: 9.5 })
  await store.updateSettings({ estimateValidDays: 14 })
  await store.close()

  const reopened = createStore()
  expect(await reopened.settings()).toStrictEqual({
    updatedAt: "2026-09-27T12:00:00.000Z",
    businessName: "Thimble Row",
    taxRate: 9.5,
    depositPct: 50,
    estimateValidDays: 14,
  })
  await reopened.close()
})

test("your own checklist item follows the seeded ones, survives reopening, and can be deleted", async () => {
  const cards = await store.addChecklistItem({ text: "Order business cards", why: "" })
  await store.setChecklistDone("seed-shopify-plan", true)
  await store.close()

  const reopened = createStore()
  const items = await reopened.checklist()
  expect(items.map((item) => [item.id, item.done])).toEqual([
    ["seed-sellers-permit", false],
    ["seed-cottage-food", false],
    ["seed-shopify-plan", true],
    ["seed-resale-certificate", false],
    [cards.id, false],
  ])
  expect(items[4]).toMatchObject({ text: "Order business cards", why: "", seeded: false })

  await reopened.deleteChecklistItem(cards.id)
  expect((await reopened.checklist()).map((item) => item.id)).not.toContain(cards.id)
  await reopened.close()
})

test("a seeded checklist item can't be deleted", async () => {
  await expect(store.deleteChecklistItem("seed-sellers-permit")).rejects.toThrow("can only be checked")
  expect((await store.checklist()).map((item) => item.id)).toContain("seed-sellers-permit")
})

test("every write tells subscribers, and they stop hearing after unsubscribing", async () => {
  const heard = vi.fn()
  const stop = store.subscribe(heard)
  const before = store.version()
  const skirt = await store.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  await store.updateProject(skirt.id, { price: 8500 })
  await store.setChecklistDone("seed-cottage-food", true)
  await store.updateSettings({ depositPct: 25 })
  expect(heard).toHaveBeenCalledTimes(4)
  expect(store.version()).toBe(before + 4)
  stop()
  await store.deleteProject(skirt.id)
  expect(heard).toHaveBeenCalledTimes(4)
})

test("an upgrade held up by an older open copy waits, then finishes once that copy closes", async () => {
  const older = await openDB("coinvoice", 1, {
    upgrade(db) {
      db.createObjectStore("projects", { keyPath: "id" })
      db.createObjectStore("checklist", { keyPath: "id" })
      db.createObjectStore("settings")
    },
  })
  const projects = store.projects()
  await vi.waitFor(() => expect(store.status()).toBe("waiting"))
  older.close()
  expect(await projects).toStrictEqual([])
  expect(store.status()).toBe("ready")
})

test("a copy that a newer version replaces says so", async () => {
  await store.projects()
  const newer = await openDB("coinvoice", 3)
  expect(store.status()).toBe("replaced")
  newer.close()
})
