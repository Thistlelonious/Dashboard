export function ItemScreen({ itemId }: { itemId: string }) {
  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Item</h1>
        <p>Item {itemId}</p>
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">Purchases</h2>
      </section>
    </>
  )
}
