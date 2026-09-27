import { type JSX, useSyncExternalStore } from "react"
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
  const route = parseRoute(useSyncExternalStore(subscribeToHash, readHash))
  return (
    <>
      <nav>
        <ul>
          <li><a href="#/">Home</a></li>
          <li><a href="#/price">Price</a></li>
          <li><a href="#/stock">Stock</a></li>
          <li><a href="#/invoices">Invoices</a></li>
          <li><a href="#/setup">Setup</a></li>
        </ul>
      </nav>
      <main>{screenFor(route)}</main>
    </>
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
