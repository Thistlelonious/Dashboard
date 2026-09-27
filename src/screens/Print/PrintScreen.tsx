import type { PrintKind } from "../../routes.ts"

const kindHeadings: Record<PrintKind, string> = {
  estimate: "Estimate",
  invoice: "Invoice",
  "cost-sheet": "Cost sheet",
}

export function PrintScreen({ documentId, kind }: { documentId: string; kind: PrintKind }) {
  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Print</h1>
        <p>Document {documentId}</p>
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">{kindHeadings[kind]}</h2>
      </section>
    </>
  )
}
