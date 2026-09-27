import type { Domain } from "./index.ts"

export const sewing = {
  id: "sewing",
  label: "Sewing",
  sellingUnit: "garment",
  stages: [
    { name: "Cut", weight: 20, waitMin: 0, batchable: false, icon: "scissors" },
    { name: "Sew", weight: 45, waitMin: 0, batchable: false, icon: "needle" },
    { name: "Fit", weight: 15, waitMin: 0, batchable: false, icon: "tape", removable: true },
    { name: "Finish", weight: 20, waitMin: 0, batchable: false, icon: "hanger" },
  ],
  allowancePct: 15,
  estimateMaterialsLabel: "Materials",
  estimateLaborLabel: "Sewing labor",
  taxable: true,
  complianceNotes: ["Check each pattern's license before selling what you make from it."],
  cardIcon: "fabric",
} satisfies Domain
