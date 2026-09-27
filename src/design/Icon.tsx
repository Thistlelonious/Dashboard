import type { IconName } from "./sewandso/index.d.ts"

export function Icon({ name, large, label }: { name: IconName; large?: boolean; label?: string }) {
  return (
    <span
      className="icon-slot"
      dangerouslySetInnerHTML={{ __html: window.SewAndSo.icon(name, { large, label }) }}
    />
  )
}
