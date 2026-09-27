import { useId } from "react"
import { Icon } from "./Icon.tsx"

export function Choices({
  label,
  options,
}: {
  label: string
  options: { key: string; label: string; checked: boolean; select: () => void }[]
}) {
  const labelId = useId()
  return (
    <div className="sas-stack sas-stack--tight">
      <span className="sas-field__label" id={labelId}>
        {label}
      </span>
      <div className="sas-actions" role="radiogroup" aria-labelledby={labelId}>
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
