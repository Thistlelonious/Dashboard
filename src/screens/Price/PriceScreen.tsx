export function PriceScreen({ projectId }: { projectId?: string }) {
  return (
    <>
      <h1>Price</h1>
      {projectId !== undefined && <p>Project {projectId}</p>}
      <section>
        <h2>Project</h2>
      </section>
      <section>
        <h2>Inputs</h2>
      </section>
      <section>
        <h2>Time per stage</h2>
      </section>
    </>
  )
}
