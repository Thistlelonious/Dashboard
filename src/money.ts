export type Cents = number
export type Percent = number

// Math.round sends every half toward +∞, which is the half-up rule PLAN.md names.
export function roundHalfUp(cents: number): Cents {
  return Math.round(cents)
}

export function basisPoints(rate: Percent): number {
  return Math.round(rate * 100)
}

export function percentOf(amount: Cents, rate: Percent): Cents {
  return roundHalfUp((amount * basisPoints(rate)) / 10_000)
}

const dollarsPattern = /^\$?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/

export function toCents(text: string): { ok: true; cents: Cents } | { ok: false } {
  const match = dollarsPattern.exec(text.trim())
  if (match === null) return { ok: false }
  const [, dollars, cents = ""] = match
  return { ok: true, cents: Number(dollars.replaceAll(",", "")) * 100 + Number(cents.padEnd(2, "0")) }
}

const percentPattern = /^(\d+(?:\.\d{1,2})?)%?$/

export function toPercent(text: string): { ok: true; percent: Percent } | { ok: false } {
  const match = percentPattern.exec(text.trim())
  if (match === null) return { ok: false }
  return { ok: true, percent: Number(match[1]) }
}

const dollarFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function formatCents(cents: Cents): string {
  return dollarFormat.format(cents / 100)
}
