export function DocumentScreen({ documentId }: { documentId: string }) {
  return (
    <>
      <h1>Document</h1>
      <p>Document {documentId}</p>
      <section>
        <h2>Details</h2>
      </section>
      <section>
        <h2>Moves</h2>
      </section>
    </>
  )
}
