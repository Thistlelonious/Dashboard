import type { ThemeId } from "./sewandso/index.d.ts"

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "colorful", label: "Colorful" },
  { id: "dark", label: "Dark" },
]

export function ThemeSwitch() {
  return (
    <div className="sas-theme-switch" role="radiogroup" aria-label="Color mode">
      {themeOptions.map(({ id, label }) => (
        <button
          key={id}
          className="sas-theme-switch__option"
          type="button"
          role="radio"
          data-sas-theme={id}
          aria-label={label}
        >
          <span className="sas-theme-switch__disc" data-theme={id} />
        </button>
      ))}
    </div>
  )
}
