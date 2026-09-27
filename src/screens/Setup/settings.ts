import { basisPoints, toPercent } from "../../money.ts"
import type { Settings } from "../../storage/db.ts"
import type { SettingsFields } from "../../storage/store.ts"

export type SettingName = keyof SettingsFields

type Parsed = { ok: true; patch: Partial<SettingsFields> } | { ok: false; message: string }

export type SettingField = {
  name: SettingName
  label: string
  unit?: string
  inputMode?: "decimal" | "numeric"
  show: (settings: Settings) => string
  parse: (text: string) => Parsed
}

function percentUpTo100(text: string, example: string, save: (percent: number) => Partial<SettingsFields>): Parsed {
  const parsed = toPercent(text)
  if (!parsed.ok || basisPoints(parsed.percent) > 10_000) {
    return { ok: false, message: `Use a number up to 100, like ${example}` }
  }
  return { ok: true, patch: save(parsed.percent) }
}

export const settingFields: SettingField[] = [
  {
    name: "businessName",
    label: "Business name",
    show: (settings) => settings.businessName,
    parse: (text) => ({ ok: true, patch: { businessName: text.trim() } }),
  },
  {
    name: "taxRate",
    label: "Tax rate",
    unit: "%",
    inputMode: "decimal",
    show: (settings) => String(settings.taxRate),
    parse: (text) => percentUpTo100(text, "10.5", (taxRate) => ({ taxRate })),
  },
  {
    name: "depositPct",
    label: "Deposit",
    unit: "%",
    inputMode: "decimal",
    show: (settings) => String(settings.depositPct),
    parse: (text) => percentUpTo100(text, "50", (depositPct) => ({ depositPct })),
  },
  {
    name: "estimateValidDays",
    label: "Estimates valid for",
    unit: "days",
    inputMode: "numeric",
    show: (settings) => String(settings.estimateValidDays),
    parse: (text) => {
      const trimmed = text.trim()
      return /^\d+$/.test(trimmed) && Number(trimmed) >= 1
        ? { ok: true, patch: { estimateValidDays: Number(trimmed) } }
        : { ok: false, message: "Use a whole number, like 30" }
    },
  },
]
