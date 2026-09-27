import type { IDBPDatabase, IDBPTransaction, StoreNames, StoreValue } from "idb"
import { z } from "zod"
import type { Hue, IconName } from "../design/sewandso/index.d.ts"
import type { DomainId } from "../pricing/domains/index.ts"
import type { CoinvoiceSchema } from "./db.ts"

type StoreValues = { [Name in StoreNames<CoinvoiceSchema>]: StoreValue<CoinvoiceSchema, Name> }
type StoreName = keyof StoreValues

export type BackupStores = { [Name in StoreName]: StoreValues[Name][] }
export type Backup = { app: "coinvoice"; version: 1; exportedAt: string; stores: BackupStores }
export type Counts = { added: number; updated: number; unchanged: number }

type Members<T extends string> = { [Member in T]: Member }

const hues: Members<Hue> = {
  rose: "rose",
  madder: "madder",
  marigold: "marigold",
  fern: "fern",
  teal: "teal",
  cornflower: "cornflower",
  plum: "plum",
}

const icons: Members<IconName> = {
  needle: "needle",
  spool: "spool",
  scissors: "scissors",
  pattern: "pattern",
  tape: "tape",
  pin: "pin",
  button: "button",
  fabric: "fabric",
  iron: "iron",
  hanger: "hanger",
  camera: "camera",
  home: "home",
  plus: "plus",
  check: "check",
  close: "close",
  "arrow-right": "arrow-right",
  "arrow-left": "arrow-left",
  alert: "alert",
  print: "print",
  send: "send",
  import: "import",
  timer: "timer",
  settings: "settings",
  delete: "delete",
  invoice: "invoice",
}

const domainIds: Members<DomainId> = { sewing: "sewing", pie: "pie" }

const sortableTime = z.iso.datetime({ precision: 3 })
const cents = z.int()
const percent = z.number()
const saved = { id: z.string(), updatedAt: sortableTime, deletedAt: sortableTime.optional() }

const stage = z.looseObject({
  name: z.string(),
  weight: z.number(),
  waitMin: z.number(),
  batchable: z.boolean(),
  icon: z.enum(icons).optional(),
  removable: z.boolean().optional(),
})

const material = z.discriminatedUnion("kind", [
  z.looseObject({ kind: z.literal("stock"), itemId: z.string(), qty: z.number(), unit: z.string(), frozenCost: cents.optional() }),
  z.looseObject({ kind: z.literal("planned"), name: z.string(), qty: z.number(), unit: z.string(), unitCost: cents }),
  z.looseObject({ kind: z.literal("fixed"), name: z.string(), cost: cents }),
])

const project = z.looseObject({
  ...saved,
  domain: z.enum(domainIds),
  name: z.string(),
  hue: z.enum(hues),
  templateId: z.string().optional(),
  price: cents,
  batchSize: z.number(),
  fee: z.looseObject({ name: z.string(), pct: percent, fixed: cents }),
  materials: z.array(material),
  overhead: cents,
  wage: cents,
  margin: percent,
  stages: z.array(stage),
  firstBuild: z.boolean(),
  built: z.boolean(),
  actualMinutes: z.number().optional(),
  timeLogs: z.array(z.looseObject({ stage: z.string(), start: sortableTime, end: sortableTime.optional() })),
})

const checklistItem = z.looseObject({ ...saved, text: z.string(), why: z.string(), done: z.boolean(), seeded: z.boolean() })

const settings = z.looseObject({
  updatedAt: sortableTime,
  businessName: z.string(),
  taxRate: percent,
  depositPct: percent,
  estimateValidDays: z.int(),
  lastBackupAt: sortableTime.optional(),
})

const storesSchema = z.strictObject({
  projects: z.array(project).default([]),
  checklist: z.array(checklistItem).default([]),
  settings: z.array(settings).max(1).default([]),
}) satisfies z.ZodType<BackupStores>

const storeNames = storesSchema.keyof().options

type Tx<Mode extends IDBTransactionMode> = IDBPTransaction<CoinvoiceSchema, StoreName[], Mode>

type StoreRule<Name extends StoreName> = {
  key: (record: StoreValues[Name]) => string
  read: (tx: Tx<IDBTransactionMode>) => Promise<StoreValues[Name][]>
  write: (tx: Tx<"readwrite">, record: StoreValues[Name]) => Promise<unknown>
  keepThisDevice?: (incoming: StoreValues[Name], local: StoreValues[Name]) => StoreValues[Name]
}

const storeRules: { [Name in StoreName]: StoreRule<Name> } = {
  projects: {
    key: (record) => record.id,
    read: (tx) => tx.objectStore("projects").getAll(),
    write: (tx, record) => tx.objectStore("projects").put(record),
  },
  checklist: {
    key: (record) => record.id,
    read: (tx) => tx.objectStore("checklist").getAll(),
    write: (tx, record) => tx.objectStore("checklist").put(record),
  },
  settings: {
    key: () => "settings",
    read: (tx) => tx.objectStore("settings").getAll(),
    write: (tx, record) => tx.objectStore("settings").put(record, "settings"),
    keepThisDevice: ({ lastBackupAt: _, ...incoming }, local) =>
      local.lastBackupAt === undefined ? incoming : { ...incoming, lastBackupAt: local.lastBackupAt },
  },
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; message: string }

const notABackup = "This file isn't a coinvoice backup. Pick a file you sent from Setup."

export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, message: notABackup }
  }
  if (!z.object({ app: z.literal("coinvoice") }).safeParse(json).success) return { ok: false, message: notABackup }
  if (!z.object({ version: z.literal(1) }).safeParse(json).success) {
    return { ok: false, message: "This backup comes from a newer coinvoice. Reload the app to update it, then merge again." }
  }
  const parsed = z
    .object({ app: z.literal("coinvoice"), version: z.literal(1), exportedAt: sortableTime, stores: storesSchema })
    .safeParse(json)
  if (!parsed.success) return { ok: false, message: "This backup is damaged, so nothing was merged. Try a newer backup file." }
  return { ok: true, backup: parsed.data }
}

export type Merge = { stores: BackupStores; changed: BackupStores; counts: Counts }

export function mergeBackup(local: BackupStores, incoming: BackupStores): Merge {
  const counts: Counts = { added: 0, updated: 0, unchanged: 0 }

  function mergeStore<Name extends StoreName>(name: Name) {
    const { key, keepThisDevice } = storeRules[name]
    const merged = new Map(local[name].map((record) => [key(record), record]))
    const writes: StoreValues[Name][] = []
    for (const record of incoming[name]) {
      const mine = merged.get(key(record))
      if (mine !== undefined && record.updatedAt <= mine.updatedAt) {
        counts.unchanged += 1
        continue
      }
      const winner = mine === undefined || keepThisDevice === undefined ? record : keepThisDevice(record, mine)
      counts[mine === undefined ? "added" : "updated"] += 1
      merged.set(key(record), winner)
      writes.push(winner)
    }
    return { all: [...merged.values()], writes }
  }

  const projects = mergeStore("projects")
  const checklist = mergeStore("checklist")
  const settings = mergeStore("settings")
  return {
    stores: { projects: projects.all, checklist: checklist.all, settings: settings.all },
    changed: { projects: projects.writes, checklist: checklist.writes, settings: settings.writes },
    counts,
  }
}

type Db = IDBPDatabase<CoinvoiceSchema>

async function readStores(tx: Tx<IDBTransactionMode>): Promise<BackupStores> {
  return {
    projects: await storeRules.projects.read(tx),
    checklist: await storeRules.checklist.read(tx),
    settings: await storeRules.settings.read(tx),
  }
}

export async function exportBackup(db: Db, exportedAt: string): Promise<Backup> {
  const tx = db.transaction([...storeNames], "readonly")
  const stores = await readStores(tx)
  await tx.done
  return { app: "coinvoice", version: 1, exportedAt, stores }
}

export async function previewMerge(db: Db, incoming: Backup): Promise<Counts> {
  const tx = db.transaction([...storeNames], "readonly")
  const local = await readStores(tx)
  await tx.done
  return mergeBackup(local, incoming.stores).counts
}

export async function applyMerge(db: Db, incoming: Backup): Promise<Counts> {
  const tx = db.transaction([...storeNames], "readwrite")
  const { changed, counts } = mergeBackup(await readStores(tx), incoming.stores)
  async function write<Name extends StoreName>(name: Name) {
    for (const record of changed[name]) await storeRules[name].write(tx, record)
  }
  for (const name of storeNames) await write(name)
  await tx.done
  return counts
}

function localDate(time: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`
}

export function backupFileName(now: Date): string {
  return `coinvoice-backup-${localDate(now)}.json`
}

const staleAfterDays = 14

export function backupReminder(lastBackupAt: string | undefined, now: Date): string | null {
  if (lastBackupAt === undefined) return "No backup yet"
  const day = (time: Date) => Date.UTC(time.getFullYear(), time.getMonth(), time.getDate())
  const days = Math.round((day(now) - day(new Date(lastBackupAt))) / 86_400_000)
  return days > staleAfterDays ? `Last backup ${days} days ago` : null
}
