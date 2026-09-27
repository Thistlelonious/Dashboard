import { useState } from "react"
import { Choices } from "../../design/Choices.tsx"
import { Field } from "../../design/Field.tsx"
import { Icon } from "../../design/Icon.tsx"
import { formatCents, type Cents } from "../../money.ts"
import { domains, type Domain } from "../../pricing/domains/index.ts"
import { feePresets } from "../../pricing/fees.ts"
import type { Project } from "../../storage/db.ts"
import { store } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"
import {
  calculate,
  formFor,
  projectInputs,
  withStage,
  type CalculatorForm,
  type CalculatorResult,
  type FieldName,
  type Mode,
  type StageRow,
} from "./calculator.ts"

const [, , , cashOrDirect] = feePresets

const startForm: CalculatorForm = {
  domain: "sewing",
  mode: "time",
  fee: cashOrDirect,
  stages: domains.sewing.stages,
  price: "",
  minutes: "",
  materials: "",
  overhead: "",
  wage: "20.00",
  margin: "20",
  batchSize: "",
}

const modes: { mode: Mode; label: string }[] = [
  { mode: "time", label: "Time from price" },
  { mode: "price", label: "Price from time" },
]

type NumberField = {
  name: FieldName
  label: string
  prefix?: string
  unit?: string
  inputMode: "decimal" | "numeric"
  onlyIn?: Mode
}

const numberFields: NumberField[] = [
  { name: "price", label: "Price", prefix: "$", inputMode: "decimal", onlyIn: "time" },
  { name: "minutes", label: "Time", unit: "min", inputMode: "decimal", onlyIn: "price" },
  { name: "materials", label: "Materials", prefix: "$", inputMode: "decimal" },
  { name: "overhead", label: "Overhead", prefix: "$", inputMode: "decimal" },
  { name: "wage", label: "Wage per hour", prefix: "$", inputMode: "decimal" },
  { name: "margin", label: "Margin", unit: "%", inputMode: "decimal" },
  { name: "batchSize", label: "Batch size", inputMode: "numeric" },
]

export function PriceScreen({ projectId }: { projectId?: string }) {
  const project = useStored(
    () => (projectId === undefined ? Promise.resolve(null) : store.project(projectId)),
    `project ${projectId ?? ""}`,
  )
  if (project === undefined) return <Header />
  return <Calculator key={project?.id ?? "unsaved"} project={project} missing={projectId !== undefined} />
}

function Header() {
  return (
    <header className="sas-panel">
      <h1 className="sas-display">Price</h1>
    </header>
  )
}

function Calculator({ project, missing }: { project: Project | null; missing: boolean }) {
  const [form, setForm] = useState(() => (project === null ? startForm : formFor(project)))
  const update = (patch: Partial<CalculatorForm>) => {
    const next = { ...form, ...patch }
    setForm(next)
    if (project !== null) void store.updateProject(project.id, projectInputs(next))
  }
  const result = calculate(form)
  const errors = result.kind === "invalid" ? result.errors : {}
  const domain: Domain = domains[form.domain]
  const removable = domain.stages.filter((stage) => stage.removable === true)

  return (
    <>
      <Header />
      <section className="sas-panel sas-stack" data-hue={project?.hue}>
        <h2 className="sas-title">Project</h2>
        {project === null ? (
          <p>
            {missing
              ? "This project isn't on this device. Nothing here is saved."
              : "Open a project from Home to save these numbers."}
          </p>
        ) : (
          <ProjectControls project={project} />
        )}
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Inputs</h2>
        {project === null && (
          <Choices
            label="Craft"
            options={Object.values(domains).map((option) => ({
              key: option.id,
              label: option.label,
              checked: option.id === form.domain,
              select: () => update({ domain: option.id, stages: option.stages }),
            }))}
          />
        )}
        <Choices
          label="Work out"
          options={modes.map(({ mode, label }) => ({
            key: mode,
            label,
            checked: mode === form.mode,
            select: () => update({ mode }),
          }))}
        />
        <Choices
          label="Fees"
          options={feePresets.map((fee) => ({
            key: fee.name,
            label: fee.name,
            checked: fee.name === form.fee.name,
            select: () => update({ fee }),
          }))}
        />
        <div className="sas-grid">
          {numberFields
            .filter(({ onlyIn }) => onlyIn === undefined || onlyIn === form.mode)
            .map((field) => (
              <Field
                key={field.name}
                label={field.label}
                prefix={field.prefix}
                unit={field.unit}
                inputMode={field.inputMode}
                value={form[field.name]}
                error={errors[field.name]}
                onChange={(value) => update({ [field.name]: value })}
              />
            ))}
        </div>
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Time per stage</h2>
        {removable.length > 0 && (
          <div className="sas-actions">
            {removable.map((stage) => {
              const on = form.stages.some(({ name }) => name === stage.name)
              return (
                <button
                  key={stage.name}
                  className="sas-button sas-button--outline"
                  type="button"
                  onClick={() =>
                    update({
                      stages: on
                        ? form.stages.filter(({ name }) => name !== stage.name)
                        : withStage(form.stages, stage, domain.stages),
                    })
                  }
                >
                  <Icon name={on ? "delete" : "plus"} />
                  {on ? `Remove ${stage.name}` : `Add ${stage.name}`}
                </button>
              )
            })}
          </div>
        )}
        <Result result={result} mode={form.mode} unit={domain.sellingUnit} />
      </section>
    </>
  )
}

type Editing = { kind: "none" } | { kind: "rename"; name: string; error?: string } | { kind: "delete" }

function ProjectControls({ project }: { project: Project }) {
  const [editing, setEditing] = useState<Editing>({ kind: "none" })
  const back = () => setEditing({ kind: "none" })

  switch (editing.kind) {
    case "none":
      return (
        <>
          <p className="sas-heading">{project.name}</p>
          <div className="sas-actions">
            <button
              className="sas-button sas-button--outline"
              type="button"
              onClick={() => setEditing({ kind: "rename", name: project.name })}
            >
              Rename
            </button>
            <button className="sas-button sas-button--outline" type="button" onClick={() => setEditing({ kind: "delete" })}>
              <Icon name="delete" />
              Delete
            </button>
          </div>
        </>
      )
    case "rename": {
      const save = () => {
        const name = editing.name.trim()
        if (name === "") {
          setEditing({ ...editing, error: "Enter a name, like Skirt" })
          return
        }
        void store.updateProject(project.id, { name })
        back()
      }
      return (
        <form
          className="sas-stack"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="sas-grid">
            <Field
              label="Name"
              value={editing.name}
              error={editing.error}
              onChange={(name) => setEditing({ kind: "rename", name })}
            />
          </div>
          <div className="sas-actions">
            <button className="sas-button" type="submit">
              <Icon name="check" />
              Save
            </button>
            <button className="sas-button sas-button--outline" type="button" onClick={back}>
              Cancel
            </button>
          </div>
        </form>
      )
    }
    case "delete":
      return (
        <>
          <p className="sas-heading">{project.name}</p>
          <p>This takes the project off Home.</p>
          <div className="sas-actions">
            <button
              className="sas-button"
              type="button"
              onClick={async () => {
                await store.deleteProject(project.id)
                location.hash = "#/"
              }}
            >
              <Icon name="delete" />
              Delete for good
            </button>
            <button className="sas-button sas-button--outline" type="button" onClick={back}>
              Keep it
            </button>
          </div>
        </>
      )
  }
}

function Result({ result, mode, unit }: { result: CalculatorResult; mode: Mode; unit: string }) {
  switch (result.kind) {
    case "incomplete":
      return <p>{mode === "time" ? "Enter a price to see each stage's time." : "Enter a time to see the price."}</p>
    case "invalid":
      return <p>Fix the marked fields to see the results.</p>
    case "short":
      return (
        <p>
          This price can't reach your margin. The break-even price is {formatCents(result.breakEvenPrice)}.
        </p>
      )
    case "time":
      return (
        <>
          <Amounts
            unit={unit}
            amounts={[
              ["Fees", result.fees],
              ["Profit target", result.profitTarget],
              ["Labor budget", result.laborBudget],
            ]}
          />
          <StageTable stages={result.stages} total={result.totalMinutes} totalAimFor={result.totalAimForMinutes} />
        </>
      )
    case "price":
      return (
        <>
          <Amounts
            unit={unit}
            amounts={[
              ["Price", result.price],
              ["Fees", result.fees],
              ["Profit target", result.profitTarget],
            ]}
          />
          <StageTable stages={result.stages} total={result.totalMinutes} totalAimFor={result.totalAimForMinutes} />
        </>
      )
  }
}

function Amounts({ unit, amounts }: { unit: string; amounts: [string, Cents][] }) {
  return (
    <table className="sas-table">
      <thead>
        <tr>
          <th scope="col">Unit</th>
          {amounts.map(([label]) => (
            <th key={label} scope="col" className="sas-table__num">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="Unit">Per {unit}</td>
          {amounts.map(([label, cents]) => (
            <td key={label} data-label={label} className="sas-table__num">
              {formatCents(cents)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

function minutes(value: number): string {
  return `${value.toFixed(1)} min`
}

function StageTable({ stages, total, totalAimFor }: { stages: StageRow[]; total: number; totalAimFor: number }) {
  const showEach = stages.some((stage) => stage.perUnitMinutes !== undefined)
  return (
    <table className="sas-table">
      <thead>
        <tr>
          <th scope="col">Stage</th>
          <th scope="col" className="sas-table__num">
            Budget
          </th>
          <th scope="col" className="sas-table__num">
            Aim for
          </th>
          {showEach && (
            <th scope="col" className="sas-table__num">
              Each
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {stages.map((stage) => (
          <tr key={stage.name}>
            <td data-label="Stage">
              <span className="sas-actions">
                {stage.icon !== undefined && <Icon name={stage.icon} />}
                {stage.name}
              </span>
            </td>
            <td data-label="Budget" className="sas-table__num">
              {minutes(stage.budgetMinutes)}
            </td>
            <td data-label="Aim for" className="sas-table__num">
              {minutes(stage.aimForMinutes)}
            </td>
            {showEach && (
              <td data-label="Each" className="sas-table__num">
                {stage.perUnitMinutes === undefined ? null : minutes(stage.perUnitMinutes)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td data-label="Stage">Total</td>
          <td data-label="Budget" className="sas-table__num">
            {minutes(total)}
          </td>
          <td data-label="Aim for" className="sas-table__num">
            {minutes(totalAimFor)}
          </td>
          {showEach && <td data-label="Each" className="sas-table__num" />}
        </tr>
      </tfoot>
    </table>
  )
}
