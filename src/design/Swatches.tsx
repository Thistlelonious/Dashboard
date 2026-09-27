import { useId } from "react"
import { Icon } from "./Icon.tsx"
import type { Hue } from "./sewandso/index.d.ts"

const hues: { hue: Hue; label: string }[] = [
  { hue: "rose", label: "Rose" },
  { hue: "madder", label: "Madder" },
  { hue: "marigold", label: "Marigold" },
  { hue: "fern", label: "Fern" },
  { hue: "teal", label: "Teal" },
  { hue: "cornflower", label: "Cornflower" },
  { hue: "plum", label: "Plum" },
]

export function Swatches({ label, value, onChange }: { label: string; value: Hue; onChange: (hue: Hue) => void }) {
  const labelId = useId()
  return (
    <div className="sas-stack sas-stack--tight">
      <span className="sas-field__label" id={labelId}>
        {label}
      </span>
      <div className="sas-swatches" role="radiogroup" aria-labelledby={labelId}>
        {hues.map(({ hue, label }) => (
          <button
            key={hue}
            className="sas-swatch"
            type="button"
            role="radio"
            aria-checked={hue === value}
            tabIndex={hue === value ? 0 : -1}
            data-value={hue}
            data-hue={hue}
            aria-label={label}
            onClick={() => onChange(hue)}
          >
            <Icon name="check" />
          </button>
        ))}
      </div>
    </div>
  )
}
