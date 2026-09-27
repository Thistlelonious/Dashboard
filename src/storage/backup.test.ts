import "fake-indexeddb/auto"
import { IDBFactory } from "fake-indexeddb"
import { afterEach, assert, beforeEach, expect, test, vi } from "vitest"
import { backupFileName, backupReminder, mergeBackup, parseBackup, type Backup, type BackupStores } from "./backup.ts"
import { openDb, type ChecklistItem, type Project, type Settings } from "./db.ts"
import { createStore, type Store } from "./store.ts"

const earlier = "2026-09-27T09:00:00.000Z"
const later = "2026-09-28T09:00:00.000Z"

function skirt(fields: Partial<Project> = {}): Project {
  return {
    id: "skirt",
    updatedAt: earlier,
    domain: "sewing",
    name: "Lined skirt",
    hue: "plum",
    price: 8500,
    batchSize: 1,
    fee: { name: "Shopify online", pct: 2.9, fixed: 30 },
    materials: [{ kind: "fixed", name: "Materials", cost: 3200 }],
    overhead: 500,
    wage: 2000,
    margin: 20,
    stages: [{ name: "Cut", weight: 20, waitMin: 0, batchable: false, icon: "scissors" }],
    firstBuild: true,
    built: false,
    timeLogs: [],
    ...fields,
  }
}

function settings(fields: Partial<Settings> = {}): Settings {
  return { updatedAt: earlier, businessName: "", taxRate: 10.5, depositPct: 50, estimateValidDays: 30, ...fields }
}

const cards: ChecklistItem = {
  id: "cards",
  updatedAt: earlier,
  text: "Order business cards",
  why: "",
  done: false,
  seeded: false,
}

function stores(fields: Partial<BackupStores> = {}): BackupStores {
  return { projects: [], checklist: [], settings: [settings()], items: [], purchases: [], stockUses: [], ...fields }
}

function file(fields: Partial<BackupStores> = {}): Backup {
  return { app: "coinvoice", version: 1, exportedAt: later, stores: stores(fields) }
}

test("a newer incoming record replaces the local one", () => {
  const merge = mergeBackup(
    stores({ projects: [skirt()] }),
    stores({ projects: [skirt({ name: "Lined skirt v2", updatedAt: later })] }),
  )
  expect(merge.stores.projects).toStrictEqual([skirt({ name: "Lined skirt v2", updatedAt: later })])
  expect(merge.counts).toStrictEqual({ added: 0, updated: 1, unchanged: 1 })
})

test("a newer local record stays when the incoming one is older", () => {
  const local = stores({ projects: [skirt({ name: "Lined skirt v2", updatedAt: later })] })
  const merge = mergeBackup(local, stores({ projects: [skirt()] }))
  expect(merge.stores).toStrictEqual(local)
  expect(merge.changed.projects).toStrictEqual([])
  expect(merge.counts).toStrictEqual({ added: 0, updated: 0, unchanged: 2 })
})

test("a tie keeps the local record", () => {
  const local = stores({ projects: [skirt({ name: "Here" })] })
  const merge = mergeBackup(local, stores({ projects: [skirt({ name: "There" })] }))
  expect(merge.stores.projects).toStrictEqual([skirt({ name: "Here" })])
  expect(merge.counts.unchanged).toBe(2)
})

test("a record deleted here stays deleted when the backup still has it", () => {
  const deleted = skirt({ deletedAt: later, updatedAt: later })
  const merge = mergeBackup(stores({ projects: [deleted] }), stores({ projects: [skirt()] }))
  expect(merge.stores.projects).toStrictEqual([deleted])
})

test("a delete in the backup removes the record here", () => {
  const deleted = skirt({ deletedAt: later, updatedAt: later })
  const merge = mergeBackup(stores({ projects: [skirt()] }), stores({ projects: [deleted] }))
  expect(merge.stores.projects).toStrictEqual([deleted])
  expect(merge.changed.projects).toStrictEqual([deleted])
})

test("records only one side has are kept, and new ones count as added", () => {
  const merge = mergeBackup(stores({ projects: [skirt()] }), stores({ checklist: [cards] }))
  expect(merge.stores.projects).toStrictEqual([skirt()])
  expect(merge.stores.checklist).toStrictEqual([cards])
  expect(merge.counts).toStrictEqual({ added: 1, updated: 0, unchanged: 1 })
})

test("merging the same backup twice gives the same records as merging it once", () => {
  const local = stores({ projects: [skirt()], settings: [settings({ lastBackupAt: earlier })] })
  const incoming = stores({
    projects: [skirt({ name: "Lined skirt v2", updatedAt: later }), skirt({ id: "pie", name: "Apple pie" })],
    checklist: [cards],
    settings: [settings({ businessName: "Thread and Crust", updatedAt: later })],
  })
  const once = mergeBackup(local, incoming)
  const twice = mergeBackup(once.stores, incoming)
  expect(twice.stores).toStrictEqual(once.stores)
  expect(twice.changed).toStrictEqual(stores({ settings: [] }))
  expect(twice.counts).toStrictEqual({ added: 0, updated: 0, unchanged: 4 })
})

test("newer settings from a backup keep this device's last backup time", () => {
  const merge = mergeBackup(
    stores({ settings: [settings({ lastBackupAt: earlier })] }),
    stores({ settings: [settings({ businessName: "Thread and Crust", updatedAt: later, lastBackupAt: later })] }),
  )
  expect(merge.stores.settings).toStrictEqual([
    settings({ businessName: "Thread and Crust", updatedAt: later, lastBackupAt: earlier }),
  ])
})

test("a device that never sent a backup still has none after merging another device's settings", () => {
  const merge = mergeBackup(stores(), stores({ settings: [settings({ updatedAt: later, lastBackupAt: later })] }))
  expect(merge.stores.settings).toStrictEqual([settings({ updatedAt: later })])
})

test("a backup file parses back to the same backup", () => {
  const backup = file({ projects: [skirt({ deletedAt: later, updatedAt: later })], checklist: [cards] })
  expect(parseBackup(JSON.stringify(backup))).toStrictEqual({ ok: true, backup })
})

test("a field this version doesn't know survives parsing, so a newer app's backup loses nothing", () => {
  const fromNewerApp = { ...skirt(), pattern: "Simplicity 8000" }
  const backup = file({ projects: [fromNewerApp] })
  expect(parseBackup(JSON.stringify(backup))).toStrictEqual({ ok: true, backup })
})

test("a file from another app is rejected", () => {
  for (const text of ["not json", "[]", JSON.stringify({ name: "coinvoice" }), JSON.stringify({ ...file(), app: "sewandso" })]) {
    expect(parseBackup(text)).toStrictEqual({
      ok: false,
      message: "This file isn't a coinvoice backup. Pick a file you sent from Setup.",
    })
  }
})

test("a backup from a newer version is rejected with a way forward", () => {
  expect(parseBackup(JSON.stringify({ ...file(), version: 2 }))).toStrictEqual({
    ok: false,
    message: "This backup comes from a newer coinvoice. Reload the app to update it, then merge again.",
  })
})

test("a damaged backup is rejected", () => {
  const damaged = [
    { ...file(), stores: { ...stores(), projects: [{ ...skirt(), price: "85" }] } },
    { ...file(), stores: { ...stores(), projects: [{ ...skirt(), updatedAt: "yesterday" }] } },
    { ...file(), stores: { ...stores(), projects: [{ ...skirt(), updatedAt: "2026-09-27T09:00:00Z" }] } },
    { ...file(), stores: { ...stores(), inventory: [] } },
  ]
  for (const backup of damaged) {
    expect(parseBackup(JSON.stringify(backup))).toStrictEqual({
      ok: false,
      message: "This backup is damaged, so nothing was merged. Try a newer backup file.",
    })
  }
})

test("the file is named for the local date", () => {
  expect(backupFileName(new Date(2026, 8, 7, 23, 30))).toBe("coinvoice-backup-2026-09-07.json")
})

test("the reminder shows until the first backup and again once one is more than 14 days old", () => {
  const today = new Date(2026, 9, 12, 8, 0)
  expect(backupReminder(undefined, today)).toBe("No backup yet")
  expect(backupReminder(new Date(2026, 8, 28, 23, 0).toISOString(), today)).toBeNull()
  expect(backupReminder(new Date(2026, 8, 27, 23, 0).toISOString(), today)).toBe("Last backup 15 days ago")
})

let laptop: Store
let phone: Store

function device() {
  const own = new IDBFactory()
  return createStore(() => {
    globalThis.indexedDB = own
    return openDb()
  })
}

beforeEach(() => {
  laptop = device()
  phone = device()
})

afterEach(async () => {
  vi.useRealTimers()
  await laptop.close()
  await phone.close()
})

function at(time: string) {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(time))
}

test("a backup covers every store the database has", async () => {
  globalThis.indexedDB = new IDBFactory()
  const db = await openDb()
  const backup = await laptop.backup()
  expect(Object.keys(backup.stores).sort()).toEqual([...db.objectStoreNames].sort())
  db.close()
})

test("a backup from one device merges into another, and merging it again changes nothing", async () => {
  at(earlier)
  const skirtProject = await laptop.createProject({ name: "Lined skirt", domain: "sewing", hue: "plum" })
  await laptop.setChecklistDone("seed-sellers-permit", true)
  await laptop.addChecklistItem({ text: "Order business cards", why: "" })
  await laptop.updateSettings({ businessName: "Thread and Crust" })
  const text = JSON.stringify(await laptop.backup())
  const parsed = parseBackup(text)
  assert(parsed.ok)

  expect(await phone.previewMerge(parsed.backup)).toStrictEqual({ added: 2, updated: 2, unchanged: 3 })
  expect(await phone.projects()).toStrictEqual([])

  expect(await phone.merge(parsed.backup)).toStrictEqual({ added: 2, updated: 2, unchanged: 3 })
  expect(await phone.projects()).toStrictEqual([skirtProject])
  expect(await phone.checklist()).toStrictEqual(await laptop.checklist())
  expect(await phone.settings()).toStrictEqual(await laptop.settings())

  expect(await phone.merge(parsed.backup)).toStrictEqual({ added: 0, updated: 0, unchanged: 7 })
})

test("sending a backup records the time without making the settings look edited", async () => {
  at(earlier)
  await laptop.updateSettings({ businessName: "Thread and Crust" })
  at(later)
  await laptop.markBackupSent()
  expect(await laptop.settings()).toMatchObject({ updatedAt: earlier, lastBackupAt: later })
})
