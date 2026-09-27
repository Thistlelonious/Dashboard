import { mkdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"
import { lightToken } from "./light-tokens.mjs"

const design = new URL("../src/design/sewandso/", import.meta.url)
const target = new URL("../public/icons/", import.meta.url)
const sizes = [192, 512]

mkdirSync(target, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent("<!doctype html><body style='margin:0'></body>")
await page.addScriptTag({ path: fileURLToPath(new URL("bundle.js", design)) })
await page.addStyleTag({
  content: readFileSync(new URL("bundle.css", design), "utf8").replace(/^@import url\("https:.*$/m, ""),
})

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size })
  await page.evaluate(
    ({ size, background, ink }) => {
      // Android crops maskable icons to a circle, so the spool stays inside the middle 60%.
      document.body.innerHTML = `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${background};color:${ink}">${window.SewAndSo.icon("spool")}</div>`
      const svg = document.querySelector("svg")
      svg.style.width = svg.style.height = `${size * 0.6}px`
    },
    { size, background: lightToken("primary"), ink: lightToken("on-primary") },
  )
  await page.screenshot({ path: fileURLToPath(new URL(`icon-${size}.png`, target)) })
}

await browser.close()
console.log(`Wrote ${sizes.map((size) => `icon-${size}.png`).join(" and ")} to public/icons/`)
