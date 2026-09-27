import { useRef, useState, type ChangeEvent } from "react"
import { Icon } from "../../design/Icon.tsx"
import { backupFileName, parseBackup, type Backup, type Counts } from "../../storage/backup.ts"
import type { Settings } from "../../storage/db.ts"
import { storageKept } from "../../storage/persistence.ts"
import { store } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"

type MergeStep =
  | { step: "idle" }
  | { step: "ready"; backup: Backup; counts: Counts }
  | { step: "merged"; counts: Counts }
  | { step: "failed"; message: string }

function countsText({ added, updated, unchanged }: Counts) {
  return `${added} added, ${updated} updated, ${unchanged} unchanged`
}

function isCancel(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = file.name
  link.click()
  // Firefox cancels a download whose URL is revoked in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url))
}

async function deliver(file: File): Promise<"sent" | "cancelled"> {
  const touchDevice = matchMedia("(pointer: coarse)").matches
  if (touchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return "sent"
    } catch (error) {
      if (isCancel(error)) return "cancelled"
    }
  }
  download(file)
  return "sent"
}

export function BackupSection({ settings }: { settings: Settings }) {
  const kept = useStored(storageKept, "storage-kept")
  const [merge, setMerge] = useState<MergeStep>({ step: "idle" })
  const picker = useRef<HTMLInputElement>(null)

  async function send() {
    const backup = await store.backup()
    const file = new File([JSON.stringify(backup, null, 2)], backupFileName(new Date()), { type: "application/json" })
    if ((await deliver(file)) === "sent") await store.markBackupSent()
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    event.target.value = ""
    if (chosen === undefined) return
    const parsed = parseBackup(await chosen.text())
    if (!parsed.ok) {
      setMerge({ step: "failed", message: parsed.message })
      return
    }
    setMerge({ step: "ready", backup: parsed.backup, counts: await store.previewMerge(parsed.backup) })
  }

  async function apply(backup: Backup) {
    setMerge({ step: "merged", counts: await store.merge(backup) })
  }

  return (
    <section className="sas-panel sas-stack">
      <h2 className="sas-title">Backup</h2>
      <div className="sas-stack sas-stack--tight">
        <p className="sas-subheading">
          {settings.lastBackupAt === undefined
            ? "No backup yet"
            : `Last backup ${new Date(settings.lastBackupAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`}
        </p>
        {kept !== undefined && <p>{kept ? "Storage kept" : "Storage may be cleared"}</p>}
      </div>
      <div className="sas-actions">
        <button className="sas-button" type="button" onClick={() => void send()}>
          <Icon name="send" />
          Send backup
        </button>
        <button className="sas-button sas-button--outline" type="button" onClick={() => picker.current?.click()}>
          <Icon name="import" />
          Merge backup
        </button>
        <input ref={picker} type="file" accept=".json,application/json" hidden onChange={(event) => void choose(event)} />
      </div>
      {merge.step === "ready" && (
        <div className="sas-stack sas-stack--tight">
          <p className="sas-subheading">{countsText(merge.counts)}</p>
          <div className="sas-actions">
            <button className="sas-button sas-button--tonal" type="button" onClick={() => void apply(merge.backup)}>
              <Icon name="check" />
              Merge
            </button>
            <button className="sas-button sas-button--outline" type="button" onClick={() => setMerge({ step: "idle" })}>
              <Icon name="close" />
              Cancel
            </button>
          </div>
        </div>
      )}
      {merge.step === "merged" && <p role="status">Merged. {countsText(merge.counts)}</p>}
      {merge.step === "failed" && (
        <p className="sas-actions" role="alert">
          <Icon name="alert" />
          {merge.message}
        </p>
      )}
    </section>
  )
}
