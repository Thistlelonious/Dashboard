import { useId, useState } from "react"
import { Choices } from "../../design/Choices.tsx"
import { Field } from "../../design/Field.tsx"
import { Icon } from "../../design/Icon.tsx"
import type { Hue, IconName } from "../../design/sewandso/index.d.ts"
import { Swatches } from "../../design/Swatches.tsx"
import { domains, type Domain, type DomainId, type StageTemplate } from "../../pricing/domains/index.ts"
import type { Project } from "../../storage/db.ts"
import { store } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"

const tiles: { label: string; href: string; icon: IconName; hue: Hue }[] = [
  { label: "Price", href: "#/price", icon: "tape", hue: "cornflower" },
  { label: "Stock", href: "#/stock", icon: "spool", hue: "fern" },
  { label: "Invoices", href: "#/invoices", icon: "invoice", hue: "plum" },
  { label: "Setup", href: "#/setup", icon: "settings", hue: "marigold" },
]

export function HomeScreen() {
  const projects = useStored(() => store.projects(), "projects")
  return (
    <>
      <header className="sas-panel">
        <h1 className="sas-display">Home</h1>
      </header>
      <nav className="sas-grid sas-grid--tiles" aria-label="Screens">
        {tiles.map(({ label, href, icon, hue }) => (
          <a key={href} className="sas-tile" href={href} data-hue={hue}>
            <span className="sas-tile__art">
              <Icon name={icon} large />
            </span>
            <span className="sas-tile__label">{label}</span>
          </a>
        ))}
      </nav>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Projects</h2>
        {projects?.length === 0 && <p>Start one under New project.</p>}
        {projects !== undefined && projects.length > 0 && (
          <div className="sas-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
      <NewProject />
    </>
  )
}

type TrackStage = StageTemplate & { icon: IconName }

function hasIcon(stage: StageTemplate): stage is TrackStage {
  return stage.icon !== undefined
}

function ProjectCard({ project }: { project: Project }) {
  const titleId = useId()
  const { cardIcon }: Domain = domains[project.domain]
  const { stages } = project
  return (
    <a className="sas-card" href={`#/price/${project.id}`} data-hue={project.hue} aria-labelledby={titleId}>
      <div className="sas-card__art" aria-hidden="true">
        {cardIcon !== undefined && <Icon name={cardIcon} />}
      </div>
      <div className="sas-card__body">
        <h3 className="sas-card__title" id={titleId}>
          {project.name}
        </h3>
        {stages.every(hasIcon) && <StageTrack stages={stages} done={project.built} />}
      </div>
    </a>
  )
}

function StageTrack({ stages, done }: { stages: TrackStage[]; done: boolean }) {
  return (
    <ol className="sas-stages" aria-label="Stages">
      {stages.map((stage, index) => (
        <li key={stage.name} className="sas-stage" data-state={done ? "done" : undefined}>
          <span className="sas-stage__node" role="img" aria-label={`${stage.name}, ${done ? "done" : "not started"}`}>
            <Icon name={stage.icon} />
          </span>
          {index < stages.length - 1 && <span className="sas-stage__thread" />}
        </li>
      ))}
    </ol>
  )
}

function NewProject() {
  const [name, setName] = useState("")
  const [domain, setDomain] = useState<DomainId>("sewing")
  const [hue, setHue] = useState<Hue>("rose")
  const [error, setError] = useState<string>()
  const titleId = useId()

  function start() {
    const trimmed = name.trim()
    if (trimmed === "") {
      setError("Enter a name, like Skirt")
      return
    }
    void store.createProject({ name: trimmed, domain, hue })
    setName("")
    setError(undefined)
  }

  return (
    <section className="sas-panel" aria-labelledby={titleId}>
      <form
        className="sas-stack"
        onSubmit={(event) => {
          event.preventDefault()
          start()
        }}
      >
        <h2 className="sas-title" id={titleId}>
          New project
        </h2>
        <div className="sas-grid">
          <Field
            label="Name"
            value={name}
            error={error}
            onChange={(value) => {
              setName(value)
              setError(undefined)
            }}
          />
        </div>
        <Choices
          label="Craft"
          options={Object.values(domains).map((option) => ({
            key: option.id,
            label: option.label,
            checked: option.id === domain,
            select: () => setDomain(option.id),
          }))}
        />
        <Swatches label="Color" value={hue} onChange={setHue} />
        <div className="sas-actions">
          <button className="sas-button" type="submit">
            <Icon name="plus" />
            Start project
          </button>
        </div>
      </form>
    </section>
  )
}
