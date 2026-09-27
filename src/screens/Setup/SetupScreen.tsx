import { useState } from "react"
import { Field } from "../../design/Field.tsx"
import { Icon } from "../../design/Icon.tsx"
import type { ChecklistItem, Settings } from "../../storage/db.ts"
import { store } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"
import { settingFields, type SettingField, type SettingName } from "./settings.ts"

export function SetupScreen() {
  const settings = useStored(() => store.settings(), "settings")
  const checklist = useStored(() => store.checklist(), "checklist")
  return (
    <>
      <header className="sas-panel">
        <h1 className="sas-display">Setup</h1>
      </header>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Settings</h2>
        {settings !== undefined && <SettingsForm settings={settings} />}
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">Backup</h2>
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Checklist</h2>
        {checklist !== undefined && (
          <ul className="sas-stack">
            {checklist.map((item) => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </ul>
        )}
        <AddItem />
      </section>
    </>
  )
}

type SettingText = { text: string; error?: string }

function SettingsForm({ settings }: { settings: Settings }) {
  const [texts, setTexts] = useState<Partial<Record<SettingName, SettingText>>>(() =>
    Object.fromEntries(settingFields.map((field) => [field.name, { text: field.show(settings) }])),
  )
  const edit = (field: SettingField, text: string) => {
    const parsed = field.parse(text)
    setTexts((current) => ({ ...current, [field.name]: parsed.ok ? { text } : { text, error: parsed.message } }))
    if (parsed.ok) void store.updateSettings(parsed.patch)
  }
  return (
    <div className="sas-grid">
      {settingFields.map((field) => (
        <Field
          key={field.name}
          label={field.label}
          unit={field.unit}
          inputMode={field.inputMode}
          value={texts[field.name]?.text ?? ""}
          error={texts[field.name]?.error}
          onChange={(text) => edit(field, text)}
        />
      ))}
    </div>
  )
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <li className="sas-stack sas-stack--tight">
      <label className="check-item">
        <input
          type="checkbox"
          defaultChecked={item.done}
          onChange={(event) => void store.setChecklistDone(item.id, event.target.checked)}
        />
        <span className="sas-subheading">{item.text}</span>
      </label>
      {item.why !== "" && <p>{item.why}</p>}
      {!item.seeded && (
        <div className="sas-actions">
          <button
            className="sas-button sas-button--outline"
            type="button"
            onClick={() => void store.deleteChecklistItem(item.id)}
          >
            <Icon name="delete" />
            Delete
          </button>
        </div>
      )}
    </li>
  )
}

function AddItem() {
  const [text, setText] = useState("")
  const [why, setWhy] = useState("")
  const [error, setError] = useState<string>()

  function add() {
    const trimmed = text.trim()
    if (trimmed === "") {
      setError("Enter an item, like Order business cards")
      return
    }
    void store.addChecklistItem({ text: trimmed, why: why.trim() })
    setText("")
    setWhy("")
    setError(undefined)
  }

  return (
    <form
      className="sas-stack"
      onSubmit={(event) => {
        event.preventDefault()
        add()
      }}
    >
      <div className="sas-grid">
        <Field
          label="Item"
          value={text}
          error={error}
          onChange={(value) => {
            setText(value)
            setError(undefined)
          }}
        />
        <Field label="Why" value={why} error={undefined} onChange={setWhy} />
      </div>
      <div className="sas-actions">
        <button className="sas-button" type="submit">
          <Icon name="plus" />
          Add item
        </button>
      </div>
    </form>
  )
}
