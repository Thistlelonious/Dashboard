import "./design/sewandso/tokens.css"
import "./design/sewandso/bundle.css"
import "./design/sewandso/bundle.js"
import "./design/local.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { workOffline } from "./offline.ts"
import { storageKept } from "./storage/persistence.ts"

window.SewAndSo.restoreTheme()
void storageKept()
workOffline()

const root = document.getElementById("root")
if (root === null) {
  throw new Error("index.html has no #root element")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
