import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Hue } from "../design/sewandso/index.d.ts"
import type { Cents, Percent } from "../money.ts"
import type { DomainId, StageTemplate } from "../pricing/domains/index.ts"
import type { FeePreset } from "../pricing/fees.ts"
import type { Saved } from "./records.ts"

export type MaterialLine =
  | { kind: "stock"; itemId: string; qty: number; unit: string; frozenCost?: Cents }
  | { kind: "planned"; name: string; qty: number; unit: string; unitCost: Cents }
  | { kind: "fixed"; name: string; cost: Cents }

export type Project = Saved & {
  domain: DomainId
  name: string
  hue: Hue
  templateId?: string
  price: Cents
  batchSize: number
  fee: FeePreset
  materials: MaterialLine[]
  overhead: Cents
  wage: Cents
  margin: Percent
  stages: StageTemplate[]
  firstBuild: boolean
  built: boolean
  actualMinutes?: number
  timeLogs: { stage: string; start: string; end?: string }[]
}

export type ChecklistItem = Saved & { text: string; why: string; done: boolean; seeded: boolean }

export type Settings = {
  updatedAt: string
  businessName: string
  taxRate: Percent
  depositPct: Percent
  estimateValidDays: number
  lastBackupAt?: string
}

export interface CoinvoiceSchema extends DBSchema {
  projects: { key: string; value: Project }
  checklist: { key: string; value: ChecklistItem }
  settings: { key: "settings"; value: Settings }
}

const beforeAnyEdit = "2026-09-26T00:00:00.000Z"

export const seededChecklist: ChecklistItem[] = [
  {
    id: "seed-sellers-permit",
    text: "Get a California seller's permit from CDTFA.",
    why: "Required before selling garments, which are taxable.",
  },
  {
    id: "seed-cottage-food",
    text: "Register as a Class A cottage food operation with LA County Public Health, Environmental Health.",
    why: "Required before selling pies. The 2026 sales cap is $88,878.",
  },
  {
    id: "seed-shopify-plan",
    text: "Confirm your Shopify plan and card rate in Shopify admin.",
    why: "The fee presets assume the Basic plan.",
  },
  {
    id: "seed-resale-certificate",
    text: "Give fabric suppliers a California resale certificate (CDTFA-230).",
    why: "With a seller's permit, materials that become part of items you sell can be bought without sales tax. That lowers the landed cost of fabric, thread, and zippers.",
  },
].map((item) => ({ ...item, updatedAt: beforeAnyEdit, done: false, seeded: true }))

const defaultSettings: Settings = {
  updatedAt: beforeAnyEdit,
  businessName: "",
  taxRate: 10.5,
  depositPct: 50,
  estimateValidDays: 30,
}

export async function openDb(): Promise<IDBPDatabase<CoinvoiceSchema>> {
  const db = await openDB<CoinvoiceSchema>("coinvoice", 1, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("projects", { keyPath: "id" })
        db.createObjectStore("checklist", { keyPath: "id" })
        db.createObjectStore("settings")
      }
    },
  })
  await seed(db)
  return db
}

async function seed(db: IDBPDatabase<CoinvoiceSchema>): Promise<void> {
  const tx = db.transaction(["checklist", "settings"], "readwrite")
  const checklist = tx.objectStore("checklist")
  const settings = tx.objectStore("settings")
  for (const item of seededChecklist) {
    if ((await checklist.getKey(item.id)) === undefined) await checklist.put(item)
  }
  if ((await settings.getKey("settings")) === undefined) await settings.put(defaultSettings, "settings")
  await tx.done
}
