#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { chromium } from "@playwright/test"

const usage = `Usage:
  node .claude/skills/verify/drive.mjs --doctor [--url <app url>]
  node .claude/skills/verify/drive.mjs <recipe.mjs> [--url <app url>] [--width <px>] [--theme light|colorful|dark]`

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at === -1 ? fallback : args[at + 1]
}
const url = option("url", "http://localhost:5199/coinvoice/")
const width = Number(option("width", "1280"))
const theme = option("theme", "light")
const recipe = args.find((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--"))
if (!args.includes("--doctor") && recipe === undefined) {
  console.error(usage)
  process.exit(2)
}

const runId = new Date().toISOString().replace(/[:.]/g, "-")
const evidence = resolve(".verify/evidence", `${recipe ? recipe.replace(/.*\//, "").replace(/\.mjs$/, "") : "doctor"}-${runId}`)
mkdirSync(evidence, { recursive: true })

// Cloud containers set these: a Chromium other than the one Playwright pinned, and an HTTPS proxy for Google Fonts.
const launchOptions = {
  executablePath: process.env.VERIFY_CHROMIUM_PATH || undefined,
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined,
  args: process.env.VERIFY_BROWSER_ARGS ? process.env.VERIFY_BROWSER_ARGS.split(" ") : [],
}

const browser = await chromium.launch(launchOptions)
const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true })
const page = await context.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
page.on("console", (message) => message.type() === "error" && errors.push(message.text()))

let shots = 0
async function shot(name) {
  shots += 1
  const base = resolve(evidence, `${String(shots).padStart(2, "0")}-${name}`)
  await page.screenshot({ path: `${base}.png`, fullPage: true })
  writeFileSync(`${base}.aria.yml`, await page.locator("body").ariaSnapshot())
  console.log(`evidence: ${base}.png`)
}

async function open(hash) {
  await page.goto(new URL(hash, url).href)
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.evaluate((id) => window.SewAndSo.setTheme(id, { remember: false }), theme)
}

let failed = false
try {
  if (args.includes("--doctor")) {
    await open("#/")
    const report = await page.evaluate(async () => {
      await document.fonts.ready
      return {
        title: document.title,
        heading: document.querySelector("h1")?.textContent,
        sewAndSo: typeof window.SewAndSo?.icon === "function",
        figtree: [...document.fonts].some((font) => font.family.replace(/["']/g, "") === "Figtree" && font.status === "loaded"),
      }
    })
    console.log(JSON.stringify({ url, ...report }))
    failed = report.title !== "coinvoice" || report.heading !== "Home" || !report.sewAndSo || !report.figtree
    await shot("home")
  } else {
    const { default: run } = await import(pathToFileURL(resolve(recipe)).href)
    await run({ page, context, open, shot, evidence })
  }
} catch (error) {
  failed = true
  console.error(error)
  await shot("failure").catch(() => {})
} finally {
  if (errors.length > 0) console.error(`page errors:\n${errors.join("\n")}`)
  await browser.close()
}
console.log(`${failed ? "FAILED" : "OK"}. Evidence in ${evidence}`)
process.exit(failed ? 1 : 0)
