export const printKinds = ["estimate", "invoice", "cost-sheet"] as const
export type PrintKind = (typeof printKinds)[number]

export type Route =
  | { name: "home" }
  | { name: "price"; projectId?: string }
  | { name: "build"; projectId: string }
  | { name: "stock" }
  | { name: "item"; itemId: string }
  | { name: "invoices" }
  | { name: "document"; documentId: string }
  | { name: "print"; documentId: string; kind: PrintKind }
  | { name: "setup" }

export function parseRoute(hash: string): Route {
  const [screen, ...ids] = hash
    .replace(/^#/, "")
    .split("/")
    .filter((segment) => segment !== "")

  switch (screen) {
    case "price":
      if (ids.length === 0) return { name: "price" }
      if (ids.length === 1) return { name: "price", projectId: ids[0] }
      break
    case "build":
      if (ids.length === 1) return { name: "build", projectId: ids[0] }
      break
    case "stock":
      if (ids.length === 0) return { name: "stock" }
      if (ids.length === 1) return { name: "item", itemId: ids[0] }
      break
    case "invoices":
      if (ids.length === 0) return { name: "invoices" }
      if (ids.length === 1) return { name: "document", documentId: ids[0] }
      break
    case "print": {
      const kind = printKinds.find((printKind) => printKind === ids[1])
      if (ids.length === 2 && kind !== undefined) {
        return { name: "print", documentId: ids[0], kind }
      }
      break
    }
    case "setup":
      if (ids.length === 0) return { name: "setup" }
      break
  }
  return { name: "home" }
}
