import type { PrintKind } from "../../routes.ts"

const kindHeadings: Record<PrintKind, string> = {
  estimate: "Estimate",
  invoice: "Invoice",
  "cost-sheet": "Cost sheet",
}

export function PrintScreen({ documentId, kind }: { documentId: string; kind: PrintKind }) {
  return (
    <>
      <h1>Print</h1>
      <p>Document {documentId}</p>
      <section>
        <h2>{kindHeadings[kind]}</h2>
      </section>
    </>
  )
}
