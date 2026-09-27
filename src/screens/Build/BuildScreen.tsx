export function BuildScreen({ projectId }: { projectId: string }) {
  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Build</h1>
        <p>Project {projectId}</p>
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">Stages</h2>
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">Pattern</h2>
      </section>
    </>
  )
}
