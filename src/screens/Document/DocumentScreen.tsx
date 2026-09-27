export function DocumentScreen({ documentId }: { documentId: string }) {
  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Document</h1>
        <p>Document {documentId}</p>
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">Details</h2>
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">Moves</h2>
      </section>
    </>
  )
}
