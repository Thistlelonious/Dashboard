import { useId } from "react"
import { Icon } from "./Icon.tsx"

export function Field({
  label,
  value,
  error,
  onChange,
  prefix,
  unit,
  inputMode,
}: {
  label: string
  value: string
  error: string | undefined
  onChange: (value: string) => void
  prefix?: string
  unit?: string
  inputMode?: "decimal" | "numeric"
}) {
  const messageId = useId()
  return (
    <label className="sas-field" data-state={error === undefined ? undefined : "error"}>
      <span className="sas-field__label">{label}</span>
      <span className="sas-field__control">
        {prefix !== undefined && <span className="sas-field__unit">{prefix}</span>}
        <input
          className="sas-field__input"
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : messageId}
        />
        {unit !== undefined && <span className="sas-field__unit">{unit}</span>}
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
