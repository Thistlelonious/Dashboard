import { type JSX, useEffect, useRef, useSyncExternalStore } from "react"
import { Icon } from "./design/Icon.tsx"
import { ThemeSwitch } from "./design/ThemeSwitch.tsx"
import { parseRoute, type Route } from "./routes.ts"
import { BuildScreen } from "./screens/Build/BuildScreen.tsx"
import { DocumentScreen } from "./screens/Document/DocumentScreen.tsx"
import { HomeScreen } from "./screens/Home/HomeScreen.tsx"
import { InvoicesScreen } from "./screens/Invoices/InvoicesScreen.tsx"
import { ItemScreen } from "./screens/Item/ItemScreen.tsx"
import { PriceScreen } from "./screens/Price/PriceScreen.tsx"
import { PrintScreen } from "./screens/Print/PrintScreen.tsx"
import { SetupScreen } from "./screens/Setup/SetupScreen.tsx"
import { StockScreen } from "./screens/Stock/StockScreen.tsx"

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function readHash() {
  return location.hash
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, readHash)
  const page = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (page.current !== null) window.SewAndSo.hydrate(page.current)
  }, [hash])

  return (
    <div className="sas-page" ref={page}>
      <header className="sas-appbar">
        <a className="sas-appbar__brand" href="#/">
          <Icon name="spool" />
          coinvoice
        </a>
        <div className="sas-appbar__end">
          <ThemeSwitch />
        </div>
      </header>
      <main className="sas-stack">{screenFor(parseRoute(hash))}</main>
    </div>
  )
}

function screenFor(route: Route): JSX.Element {
  switch (route.name) {
    case "home":
      return <HomeScreen />
    case "price":
      return <PriceScreen projectId={route.projectId} />
    case "build":
      return <BuildScreen projectId={route.projectId} />
    case "stock":
      return <StockScreen />
    case "item":
      return <ItemScreen itemId={route.itemId} />
    case "invoices":
      return <InvoicesScreen />
    case "document":
      return <DocumentScreen documentId={route.documentId} />
    case "print":
      return <PrintScreen documentId={route.documentId} kind={route.kind} />
    case "setup":
      return <SetupScreen />
  }
}
