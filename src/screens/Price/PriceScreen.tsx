export function PriceScreen({ projectId }: { projectId?: string }) {
  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Price</h1>
        {projectId !== undefined && <p>Project {projectId}</p>}
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">Project</h2>
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">Inputs</h2>
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">Time per stage</h2>
      </section>
    </>
  )
}
