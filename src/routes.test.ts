import { expect, test } from "vitest"
import { parseRoute, type Route } from "./routes.ts"

test.each<[string, Route]>([
  ["#/", { name: "home" }],
  ["#/price", { name: "price" }],
  ["#/price/p1", { name: "price", projectId: "p1" }],
  ["#/build/p2", { name: "build", projectId: "p2" }],
  ["#/stock", { name: "stock" }],
  ["#/stock/", { name: "stock" }],
  ["#/stock/i3", { name: "item", itemId: "i3" }],
  ["#/invoices", { name: "invoices" }],
  ["#/invoices/d4", { name: "document", documentId: "d4" }],
  ["#/print/d5/estimate", { name: "print", documentId: "d5", kind: "estimate" }],
  ["#/print/d6/invoice", { name: "print", documentId: "d6", kind: "invoice" }],
  ["#/print/d7/cost-sheet", { name: "print", documentId: "d7", kind: "cost-sheet" }],
  ["#/setup", { name: "setup" }],
])("parses %j", (hash, route) => {
  expect(parseRoute(hash)).toStrictEqual(route)
})

test.each(["", "#/nowhere", "#/print/x/bogus", "#/build", "#/stock/a/b"])(
  "falls back to home for %j",
  (hash) => {
    expect(parseRoute(hash)).toStrictEqual({ name: "home" })
  },
)
