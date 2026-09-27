import type { IDBPDatabase } from "idb"
import type { Hue } from "../design/sewandso/index.d.ts"
import { domains, type DomainId } from "../pricing/domains/index.ts"
import { feePresets } from "../pricing/fees.ts"
import { applyMerge, exportBackup, previewMerge, type Backup, type Counts } from "./backup.ts"
import {
  openDb,
  type DbEvents,
  seededChecklist,
  type ChecklistItem,
  type CoinvoiceSchema,
  type InventoryItem,
  type Project,
  type Purchase,
  type Settings,
  type StockUse,
} from "./db.ts"
import { live, newRecord, softDelete, touch, type Saved } from "./records.ts"

export type ProjectFields = Omit<Project, keyof Saved>
export type SettingsFields = Omit<Settings, "updatedAt" | "lastBackupAt">
export type ItemFields = Omit<InventoryItem, keyof Saved>
export type Inventory = { items: InventoryItem[]; purchases: Purchase[]; uses: StockUse[] }
export type NewPurchase = {
  item: { existing: string } | { create: ItemFields }
  vendor: string
  date: string
  qty: number
  unit: string
  landedCost: number
}

const [, , , cashOrDirect] = feePresets
const seedOrder = seededChecklist.map((item) => item.id)

function now() {
  return new Date().toISOString()
}

function newestFirst(a: Saved, b: Saved) {
  return b.updatedAt.localeCompare(a.updatedAt)
}

function seededFirstThenByText(a: ChecklistItem, b: ChecklistItem) {
  if (a.seeded !== b.seeded) return a.seeded ? -1 : 1
  if (a.seeded) return seedOrder.indexOf(a.id) - seedOrder.indexOf(b.id)
  return a.text.localeCompare(b.text)
}

function found<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`${what} is missing`)
  return value
}

export type StorageStatus = "ready" | "waiting" | "replaced"

export function createStore(open: (events: DbEvents) => Promise<IDBPDatabase<CoinvoiceSchema>> = openDb) {
  let opening: Promise<IDBPDatabase<CoinvoiceSchema>> | undefined
  let status: StorageStatus = "ready"
  const setStatus = (next: StorageStatus) => {
    status = next
    notify()
  }
  const db = () =>
    (opening ??= open({ blocked: () => setStatus("waiting"), replaced: () => setStatus("replaced") }).then((opened) => {
      if (status === "waiting") setStatus("ready")
      return opened
    }))
  const listeners = new Set<() => void>()
  let version = 0
  let merges = 0

  function notify() {
    for (const listener of listeners) listener()
  }

  function changed() {
    version += 1
    notify()
  }

  async function change<Name extends "projects" | "checklist">(
    name: Name,
    id: string,
    edit: (record: CoinvoiceSchema[Name]["value"]) => CoinvoiceSchema[Name]["value"],
  ) {
    const tx = (await db()).transaction(name, "readwrite")
    const record = found(await tx.store.get(id), `${name} record ${id}`)
    await tx.store.put(edit(record))
    await tx.done
    changed()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    version: () => version,
    status: () => status,
    merges: () => merges,

    async close() {
      const closing = opening
      opening = undefined
      if (closing !== undefined) (await closing).close()
    },

    async projects(): Promise<Project[]> {
      return live(await (await db()).getAll("projects")).sort(newestFirst)
    },

    async project(id: string): Promise<Project | null> {
      const project = await (await db()).get("projects", id)
      return project === undefined || project.deletedAt !== undefined ? null : project
    },

    async createProject({ name, domain, hue }: { name: string; domain: DomainId; hue: Hue }): Promise<Project> {
      const fields: ProjectFields = {
        domain,
        name,
        hue,
        price: 0,
        batchSize: 1,
        fee: cashOrDirect,
        materials: [],
        overhead: 0,
        wage: 2000,
        margin: 20,
        stages: [...domains[domain].stages],
        firstBuild: true,
        built: false,
        timeLogs: [],
      }
      const project = newRecord(fields, now())
      await (await db()).put("projects", project)
      changed()
      return project
    },

    updateProject(id: string, patch: Partial<ProjectFields>) {
      return change("projects", id, (project) => touch({ ...project, ...patch }, now()))
    },

    deleteProject(id: string) {
      return change("projects", id, (project) => softDelete(project, now()))
    },

    async checklist(): Promise<ChecklistItem[]> {
      return live(await (await db()).getAll("checklist")).sort(seededFirstThenByText)
    },

    async addChecklistItem({ text, why }: { text: string; why: string }): Promise<ChecklistItem> {
      const item = newRecord({ text, why, done: false, seeded: false }, now())
      await (await db()).put("checklist", item)
      changed()
      return item
    },

    setChecklistDone(id: string, done: boolean) {
      return change("checklist", id, (item) => touch({ ...item, done }, now()))
    },

    deleteChecklistItem(id: string) {
      return change("checklist", id, (item) => {
        if (item.seeded) throw new Error(`${id} is a seeded checklist item, which can only be checked`)
        return softDelete(item, now())
      })
    },

    async settings(): Promise<Settings> {
      return found(await (await db()).get("settings", "settings"), "the seeded settings record")
    },

    async updateSettings(patch: Partial<SettingsFields>) {
      const tx = (await db()).transaction("settings", "readwrite")
      const settings = found(await tx.store.get("settings"), "the seeded settings record")
      await tx.store.put(touch({ ...settings, ...patch }, now()), "settings")
      await tx.done
      changed()
    },

    async inventory(): Promise<Inventory> {
      const tx = (await db()).transaction(["items", "purchases", "stockUses"])
      const inventory = {
        items: live(await tx.objectStore("items").getAll()),
        purchases: live(await tx.objectStore("purchases").getAll()),
        uses: live(await tx.objectStore("stockUses").getAll()),
      }
      await tx.done
      return inventory
    },

    async addPurchase({ item, ...purchase }: NewPurchase): Promise<Purchase> {
      const tx = (await db()).transaction(["items", "purchases"], "readwrite")
      let itemId: string
      if ("existing" in item) {
        itemId = item.existing
      } else {
        const created = newRecord(item.create, now())
        await tx.objectStore("items").put(created)
        itemId = created.id
      }
      const saved = newRecord({ ...purchase, itemId, receiptId: "" }, now())
      const record = { ...saved, receiptId: `manual-${saved.id}` }
      await tx.objectStore("purchases").put(record)
      await tx.done
      changed()
      return record
    },

    async adjustStock(use: { itemId: string; date: string; qty: number; unit: string }): Promise<StockUse> {
      const record = newRecord({ ...use, reason: "adjustment" as const }, now())
      await (await db()).put("stockUses", record)
      changed()
      return record
    },

    async backup(): Promise<Backup> {
      return exportBackup(await db(), now())
    },

    async markBackupSent() {
      const tx = (await db()).transaction("settings", "readwrite")
      const settings = found(await tx.store.get("settings"), "the seeded settings record")
      await tx.store.put({ ...settings, lastBackupAt: now() }, "settings")
      await tx.done
      changed()
    },

    async previewMerge(backup: Backup): Promise<Counts> {
      return previewMerge(await db(), backup)
    },

    async merge(backup: Backup): Promise<Counts> {
      const counts = await applyMerge(await db(), backup)
      merges += 1
      changed()
      return counts
    },
  }
}

export type Store = ReturnType<typeof createStore>

export const store = createStore()
