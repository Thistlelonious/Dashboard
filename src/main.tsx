import "./design/sewandso/tokens.css"
import "./design/sewandso/bundle.css"
import "./design/sewandso/bundle.js"
import "./design/local.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"

window.SewAndSo.restoreTheme()

const root = document.getElementById("root")
if (root === null) {
  throw new Error("index.html has no #root element")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
