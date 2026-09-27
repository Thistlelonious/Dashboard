import { useState } from "react"
import { Icon } from "../../design/Icon.tsx"
import { formatCents, type Cents } from "../../money.ts"
import { domains } from "../../pricing/domains/index.ts"
import { feePresets } from "../../pricing/fees.ts"
import {
  calculate,
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
  stagesOff: [],
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
  const [form, setForm] = useState(startForm)
  const update = (patch: Partial<CalculatorForm>) => setForm((current) => ({ ...current, ...patch }))
  const result = calculate(form)
  const errors = result.kind === "invalid" ? result.errors : {}

  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">Price</h1>
        {projectId !== undefined && <p>Project {projectId}</p>}
      </header>
      <section className="sas-panel">
        <h2 className="sas-title">Project</h2>
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Inputs</h2>
        <Choices
          id="price-domain"
          label="Craft"
          options={Object.values(domains).map((domain) => ({
            key: domain.id,
            label: domain.label,
            checked: domain.id === form.domain,
            select: () => update({ domain: domain.id }),
          }))}
        />
        <Choices
          id="price-mode"
          label="Work out"
          options={modes.map(({ mode, label }) => ({
            key: mode,
            label,
            checked: mode === form.mode,
            select: () => update({ mode }),
          }))}
        />
        <Choices
          id="price-fee"
          label="Fees"
          options={feePresets.map((fee) => ({
            key: fee.name,
            label: fee.name,
            checked: fee === form.fee,
            select: () => update({ fee }),
          }))}
        />
        <div className="sas-grid">
          {numberFields
            .filter(({ onlyIn }) => onlyIn === undefined || onlyIn === form.mode)
            .map((field) => (
              <NumberInput
                key={field.name}
                field={field}
                value={form[field.name]}
                error={errors[field.name]}
                onChange={(value) => update({ [field.name]: value })}
              />
            ))}
        </div>
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Time per stage</h2>
        <Result result={result} mode={form.mode} unit={domains[form.domain].sellingUnit} />
      </section>
    </>
  )
}

function Choices({
  id,
  label,
  options,
}: {
  id: string
  label: string
  options: { key: string; label: string; checked: boolean; select: () => void }[]
}) {
  return (
    <div className="sas-stack sas-stack--tight">
      <span className="sas-field__label" id={id}>
        {label}
      </span>
      <div className="sas-actions" role="radiogroup" aria-labelledby={id}>
        {options.map((option) => (
          <button
            key={option.key}
            className={option.checked ? "sas-button sas-button--tonal" : "sas-button sas-button--outline"}
            type="button"
            role="radio"
            aria-checked={option.checked}
            tabIndex={option.checked ? 0 : -1}
            data-value={option.key}
            onClick={option.select}
          >
            {option.checked && <Icon name="check" />}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function NumberInput({
  field,
  value,
  error,
  onChange,
}: {
  field: NumberField
  value: string
  error: string | undefined
  onChange: (value: string) => void
}) {
  const messageId = `price-${field.name}-message`
  return (
    <label className="sas-field" data-state={error === undefined ? undefined : "error"}>
      <span className="sas-field__label">{field.label}</span>
      <span className="sas-field__control">
        {field.prefix !== undefined && <span className="sas-field__unit">{field.prefix}</span>}
        <input
          className="sas-field__input"
          type="text"
          inputMode={field.inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : messageId}
        />
        {field.unit !== undefined && <span className="sas-field__unit">{field.unit}</span>}
      </span>
      {error !== undefined && (
        <span className="sas-field__message" id={messageId}>
          <Icon name="alert" />
          {error}
        </span>
      )}
    </label>
  )
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
