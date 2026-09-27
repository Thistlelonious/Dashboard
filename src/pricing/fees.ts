import type { Cents, Percent } from "../money.ts"

export type FeePreset = { name: string; pct: Percent; fixed: Cents }

export const feePresets: readonly FeePreset[] = [
  { name: "Shopify online", pct: 2.9, fixed: 30 },
  { name: "Shopify in person", pct: 2.6, fixed: 10 },
  { name: "Etsy", pct: 9.5, fixed: 45 },
  { name: "Cash or direct", pct: 0, fixed: 0 },
]
