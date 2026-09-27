import type { Domain } from "./index.ts"

export const pie = {
  id: "pie",
  label: "Pies",
  sellingUnit: "batch",
  stages: [
    { name: "Crust", weight: 30, waitMin: 0, batchable: true },
    { name: "Filling", weight: 25, waitMin: 0, batchable: true },
    { name: "Assembly and crimping", weight: 20, waitMin: 0, batchable: false },
    { name: "Baking (hands-on)", weight: 10, waitMin: 0, batchable: true },
    { name: "Cooling and packaging", weight: 15, waitMin: 0, batchable: false },
  ],
  allowancePct: 10,
  estimateMaterialsLabel: "Ingredients and packaging",
  estimateLaborLabel: "Baking labor",
  taxable: false,
  complianceNotes: [
    "Fruit pies are allowed under California cottage food law. Cream, custard, and meringue pies are not.",
  ],
} satisfies Domain
