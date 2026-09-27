import type { IconName } from "../../design/sewandso/index.d.ts"
import { basisPoints, toCents, toPercent, type Cents } from "../../money.ts"
import { domains, type DomainId } from "../../pricing/domains/index.ts"
import type { FeePreset } from "../../pricing/fees.ts"
import { aimForMinutes, laborBudget, priceForMinutes, stageBudgets } from "../../pricing/pricing.ts"

export type Mode = "time" | "price"

export type FieldName = "price" | "minutes" | "materials" | "overhead" | "wage" | "margin" | "batchSize"

export type CalculatorForm = Record<FieldName, string> & {
  domain: DomainId
  mode: Mode
  fee: FeePreset
  stagesOff: readonly string[]
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

export function calculate(form: CalculatorForm): CalculatorResult {
  const errors: Partial<Record<FieldName, string>> = {}
  const read = (name: FieldName, field: Field): number | undefined => {
    if (field.kind === "bad") errors[name] = field.message
    return field.kind === "ok" ? field.value : undefined
  }

  const main =
    form.mode === "time" ? read("price", parseMoney(form.price)) : read("minutes", parseMinutes(form.minutes))
  const materials = read("materials", parseMoney(form.materials)) ?? 0
  const overhead = read("overhead", parseMoney(form.overhead)) ?? 0
  const wage = read("wage", parseWage(form.wage))
  const margin = read("margin", parseMargin(form.margin, form.fee))
  const units = read("batchSize", parseBatchSize(form.batchSize)) ?? 1

  if (Object.keys(errors).length > 0) return { kind: "invalid", errors }
  if (main === undefined || wage === undefined || margin === undefined) return { kind: "incomplete" }

  const inputs = { fee: form.fee, materials, overhead, wage, margin }
  const times = (totalMinutes: number) => stageTimes(form.domain, form.stagesOff, units, totalMinutes)

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
  stagesOff: readonly string[],
  units: number,
  totalMinutes: number,
): StageTimes {
  const { stages, allowancePct } = domains[domainId]
  const on = stages.filter((stage) => !stagesOff.includes(stage.name))
  return {
    totalMinutes,
    totalAimForMinutes: aimForMinutes(totalMinutes, allowancePct),
    stages: stageBudgets(totalMinutes, on, allowancePct).map((stage) => ({
      name: stage.name,
      icon: stage.icon,
      budgetMinutes: stage.budgetMinutes,
      aimForMinutes: stage.aimForMinutes,
      perUnitMinutes: units > 1 && !stage.batchable ? stage.budgetMinutes / units : undefined,
    })),
  }
}
