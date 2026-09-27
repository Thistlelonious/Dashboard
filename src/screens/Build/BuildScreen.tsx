export function BuildScreen({ projectId }: { projectId: string }) {
  return (
    <>
      <h1>Build</h1>
      <p>Project {projectId}</p>
      <section>
        <h2>Stages</h2>
      </section>
      <section>
        <h2>Pattern</h2>
      </section>
    </>
  )
}
