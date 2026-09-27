import type { IconName } from "../../design/sewandso/index.d.ts"
import type { Percent } from "../../money.ts"
import { pie } from "./pie.ts"
import { sewing } from "./sewing.ts"

export type StageTemplate = {
  name: string
  weight: number
  waitMin: number
  batchable: boolean
  icon?: IconName
  removable?: boolean
}

export type Domain = {
  id: "sewing" | "pie"
  label: string
  sellingUnit: string
  stages: StageTemplate[]
  allowancePct: Percent
  estimateMaterialsLabel: string
  estimateLaborLabel: string
  taxable: boolean
  complianceNotes: string[]
  cardIcon?: IconName
}

export type DomainId = Domain["id"]

export const domains = { sewing, pie } satisfies { [Id in DomainId]: Domain & { id: Id } }
