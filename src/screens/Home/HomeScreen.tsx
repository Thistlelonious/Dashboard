import { Icon } from "../../design/Icon.tsx"
import type { Hue, IconName } from "../../design/sewandso/index.d.ts"

const tiles: { label: string; href: string; icon: IconName; hue: Hue }[] = [
  { label: "Price", href: "#/price", icon: "tape", hue: "cornflower" },
  { label: "Stock", href: "#/stock", icon: "spool", hue: "fern" },
  { label: "Invoices", href: "#/invoices", icon: "invoice", hue: "plum" },
  { label: "Setup", href: "#/setup", icon: "settings", hue: "marigold" },
]

export function HomeScreen() {
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
      <section className="sas-panel">
        <h2 className="sas-title">Projects</h2>
      </section>
      <section className="sas-panel">
        <h2 className="sas-title">New project</h2>
      </section>
    </>
  )
}
