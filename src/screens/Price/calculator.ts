import type { IconName } from "../../design/sewandso/index.d.ts"
import { basisPoints, toCents, toPercent, type Cents } from "../../money.ts"
import { domains, type DomainId, type StageTemplate } from "../../pricing/domains/index.ts"
import type { FeePreset } from "../../pricing/fees.ts"
import { aimForMinutes, laborBudget, priceForMinutes, stageBudgets } from "../../pricing/pricing.ts"
import type { Project } from "../../storage/db.ts"
import type { ProjectFields } from "../../storage/store.ts"

export type Mode = "time" | "price"

export type FieldName = "price" | "minutes" | "materials" | "overhead" | "wage" | "margin" | "batchSize"

export type CalculatorForm = Record<FieldName, string> & {
  domain: DomainId
  mode: Mode
  fee: FeePreset
  stages: readonly StageTemplate[]
}

export type StageRow = {
  name: string
  icon?: IconName
  budgetMinutes: number
  aimForMinutes: number
  perUnitMinutes?: number
}

type StageTimes = { totalMinutes: number; totalAimForMinutes: number; stages: StageRow[] }

export type CalculatorResult =
  | { kind: "incomplete" }
  | { kind: "invalid"; errors: Partial<Record<FieldName, string>> }
  | { kind: "short"; fees: Cents; profitTarget: Cents; breakEvenPrice: Cents }
  | ({ kind: "time"; fees: Cents; profitTarget: Cents; laborBudget: Cents } & StageTimes)
  | ({ kind: "price"; price: Cents; fees: Cents; profitTarget: Cents } & StageTimes)

type Field = { kind: "empty" } | { kind: "bad"; message: string } | { kind: "ok"; value: number }

const moneyMessage = "Use a number, like 85.00"

function parseMoney(text: string): Field {
  if (text.trim() === "") return { kind: "empty" }
  const parsed = toCents(text)
  return parsed.ok ? { kind: "ok", value: parsed.cents } : { kind: "bad", message: moneyMessage }
}

function parseWage(text: string): Field {
  const parsed = toCents(text)
  if (!parsed.ok) return { kind: "bad", message: moneyMessage }
  if (parsed.cents === 0) return { kind: "bad", message: "Use a wage above 0, like 20.00" }
  return { kind: "ok", value: parsed.cents }
}

function parseMargin(text: string, fee: FeePreset): Field {
  const parsed = toPercent(text)
  if (!parsed.ok) return { kind: "bad", message: "Use a number, like 20" }
  if (basisPoints(fee.pct) + basisPoints(parsed.percent) >= 10_000) {
    return { kind: "bad", message: "Keep fees and margin under 100%" }
  }
  return { kind: "ok", value: parsed.percent }
}

function parseMinutes(text: string): Field {
  const trimmed = text.trim()
  if (trimmed === "") return { kind: "empty" }
  return /^\d+(?:\.\d+)?$/.test(trimmed)
    ? { kind: "ok", value: Number(trimmed) }
    : { kind: "bad", message: "Use a number, like 90" }
}

function parseBatchSize(text: string): Field {
  const trimmed = text.trim()
  if (trimmed === "") return { kind: "empty" }
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 1
    ? { kind: "ok", value: Number(trimmed) }
    : { kind: "bad", message: "Use a whole number, like 6" }
}

function parseFields(form: CalculatorForm): Record<FieldName, Field> {
  return {
    price: parseMoney(form.price),
    minutes: parseMinutes(form.minutes),
    materials: parseMoney(form.materials),
    overhead: parseMoney(form.overhead),
    wage: parseWage(form.wage),
    margin: parseMargin(form.margin, form.fee),
    batchSize: parseBatchSize(form.batchSize),
  }
}

export function calculate(form: CalculatorForm): CalculatorResult {
  const fields = parseFields(form)
  const errors: Partial<Record<FieldName, string>> = {}
  const read = (name: FieldName): number | undefined => {
    const field = fields[name]
    if (field.kind === "bad") errors[name] = field.message
    return field.kind === "ok" ? field.value : undefined
  }

  const main = form.mode === "time" ? read("price") : read("minutes")
  const materials = read("materials") ?? 0
  const overhead = read("overhead") ?? 0
  const wage = read("wage")
  const margin = read("margin")
  const units = read("batchSize") ?? 1

  if (Object.keys(errors).length > 0) return { kind: "invalid", errors }
  if (main === undefined || wage === undefined || margin === undefined) return { kind: "incomplete" }

  const inputs = { fee: form.fee, materials, overhead, wage, margin }
  const times = (totalMinutes: number) => stageTimes(form.domain, form.stages, units, totalMinutes)

  if (form.mode === "price") {
    const price = priceForMinutes(inputs, main)
    const { fees, profitTarget } = laborBudget({ ...inputs, price })
    return { kind: "price", price, fees, profitTarget, ...times(main) }
  }

  const labor = laborBudget({ ...inputs, price: main })
  if (labor.kind === "short") return labor
  return { ...labor, kind: "time", ...times(labor.totalMinutes) }
}

function stageTimes(
  domainId: DomainId,
  stages: readonly StageTemplate[],
  units: number,
  totalMinutes: number,
): StageTimes {
  const { allowancePct } = domains[domainId]
  return {
    totalMinutes,
    totalAimForMinutes: aimForMinutes(totalMinutes, allowancePct),
    stages: stageBudgets(totalMinutes, stages, allowancePct).map((stage) => ({
      name: stage.name,
      icon: stage.icon,
      budgetMinutes: stage.budgetMinutes,
      aimForMinutes: stage.aimForMinutes,
      perUnitMinutes: units > 1 && !stage.batchable ? stage.budgetMinutes / units : undefined,
    })),
  }
}

const savedFieldNames = ["price", "materials", "overhead", "wage", "margin", "batchSize"] as const
type SavedFieldName = (typeof savedFieldNames)[number]

const savedFields: {
  [Name in SavedFieldName]: {
    money: boolean
    blankValue?: number
    load: (project: Project) => number
    save: (value: number) => Partial<ProjectFields>
  }
} = {
  price: { money: true, blankValue: 0, load: (project) => project.price, save: (price) => ({ price }) },
  materials: {
    money: true,
    blankValue: 0,
    load: (project) => project.materials.find((line) => line.kind === "fixed")?.cost ?? 0,
    save: (cost) => ({ materials: [{ kind: "fixed", name: "Materials", cost }] }),
  },
  overhead: { money: true, blankValue: 0, load: (project) => project.overhead, save: (overhead) => ({ overhead }) },
  wage: { money: true, load: (project) => project.wage, save: (wage) => ({ wage }) },
  margin: { money: false, load: (project) => project.margin, save: (margin) => ({ margin }) },
  batchSize: { money: false, blankValue: 1, load: (project) => project.batchSize, save: (batchSize) => ({ batchSize }) },
}

function fieldText(name: SavedFieldName, value: number): string {
  const { money, blankValue } = savedFields[name]
  if (value === blankValue) return ""
  if (!money) return String(value)
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`
}

export function formFor(project: Project): CalculatorForm {
  const text = (name: SavedFieldName) => fieldText(name, savedFields[name].load(project))
  return {
    domain: project.domain,
    mode: "time",
    fee: project.fee,
    stages: project.stages,
    minutes: "",
    price: text("price"),
    materials: text("materials"),
    overhead: text("overhead"),
    wage: text("wage"),
    margin: text("margin"),
    batchSize: text("batchSize"),
  }
}

export function parsedProjectInputs(form: CalculatorForm): Partial<ProjectFields> {
  const fields = parseFields(form)
  let inputs: Partial<ProjectFields> = { fee: form.fee, stages: [...form.stages] }
  for (const name of savedFieldNames) {
    const field = fields[name]
    const { blankValue, save } = savedFields[name]
    if (field.kind === "ok") inputs = { ...inputs, ...save(field.value) }
    if (field.kind === "empty" && blankValue !== undefined) inputs = { ...inputs, ...save(blankValue) }
  }
  return inputs
}

export function withStage(
  stages: readonly StageTemplate[],
  added: StageTemplate,
  domainStages: readonly StageTemplate[],
): StageTemplate[] {
  const order = domainStages.map((stage) => stage.name)
  return [...stages, added].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
}
