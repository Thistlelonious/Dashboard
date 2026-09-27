import { basisPoints, percentOf, roundHalfUp, type Cents, type Percent } from "../money.ts"
import type { StageTemplate } from "./domains/index.ts"
import type { FeePreset } from "./fees.ts"

export type PricingInputs = {
  price: Cents
  fee: FeePreset
  materials: Cents
  overhead: Cents
  wage: Cents
  margin: Percent
}

export type LaborResult =
  | { kind: "fits"; fees: Cents; profitTarget: Cents; laborBudget: Cents; totalMinutes: number }
  | { kind: "short"; fees: Cents; profitTarget: Cents; breakEvenPrice: Cents }

export function laborBudget(inputs: PricingInputs): LaborResult {
  const { price, fee, materials, overhead, wage, margin } = inputs
  const fees = percentOf(price, fee.pct) + fee.fixed
  const profitTarget = percentOf(price, margin)
  const budget = price - fees - materials - overhead - profitTarget
  if (budget <= 0) {
    return { kind: "short", fees, profitTarget, breakEvenPrice: priceForMinutes(inputs, 0) }
  }
  return { kind: "fits", fees, profitTarget, laborBudget: budget, totalMinutes: (budget * 60) / wage }
}

export function stageBudgets(
  totalMinutes: number,
  stages: readonly StageTemplate[],
  allowancePct: Percent,
): { name: string; budgetMinutes: number; aimForMinutes: number }[] {
  const weightSum = stages.reduce((sum, stage) => sum + stage.weight, 0)
  return stages.map((stage) => {
    const budgetMinutes = (totalMinutes * stage.weight) / weightSum
    return { name: stage.name, budgetMinutes, aimForMinutes: (budgetMinutes * 100) / (100 + allowancePct) }
  })
}

export function priceForMinutes(inputs: Omit<PricingInputs, "price">, minutes: number): Cents {
  const { fee, materials, overhead, wage, margin } = inputs
  const keptBasisPoints = 10_000 - basisPoints(fee.pct) - basisPoints(margin)
  const costsTimes60 = minutes * wage + 60 * (materials + overhead + fee.fixed)
  return roundHalfUp((costsTimes60 * 10_000) / (60 * keptBasisPoints))
}

export function estimateTotals(args: {
  price: Cents
  materials: Cents
  taxRate: Percent
  taxable: boolean
  depositPct: Percent
}): { labor: Cents; subtotal: Cents; tax: Cents; total: Cents; deposit: Cents; balance: Cents } {
  const { price, materials, taxRate, taxable, depositPct } = args
  const tax = taxable ? percentOf(price, taxRate) : 0
  const total = price + tax
  const deposit = percentOf(total, depositPct)
  return { labor: price - materials, subtotal: price, tax, total, deposit, balance: total - deposit }
}
