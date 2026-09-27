import { formatCents, roundHalfUp } from "../../money.ts"
import { unitName } from "../../inventory/units.ts"

export function formatQty(qty: number, unit: string): string {
  return `${Number(qty.toFixed(3))} ${unit}`
}

export function formatUnitCost(cents: number, unit: string): string {
  const price = formatCents(roundHalfUp(cents))
  return unit === "each" ? `${price} each` : `${price} per ${unitName(unit, "singular")}`
}
