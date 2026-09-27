import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { readTokens, tokensToCss } from "../../SewAndSo/scripts/tokens-to-css.mjs"

const source = new URL("../../SewAndSo/project/components/", import.meta.url)
const target = new URL("../src/design/sewandso/", import.meta.url)

const files = {
  "bundle.css": readFileSync(new URL("bundle.css", source)),
  "bundle.js": readFileSync(new URL("bundle.js", source)),
  "index.d.ts": readFileSync(new URL("index.d.ts", source)),
  "tokens.css": tokensToCss(readTokens()),
}

mkdirSync(target, { recursive: true })
for (const [name, body] of Object.entries(files)) {
  writeFileSync(new URL(name, target), body)
}

const syncDate = new Date().toISOString().slice(0, 10)
const rows = Object.entries(files).map(
  ([name, body]) => `| \`${name}\` | \`${createHash("sha256").update(body).digest("hex")}\` |`,
)
const sourceNote = [
  "# SewAndSo copy",
  "",
  `\`npm run sync:design\` copied these files from \`../SewAndSo/project\` on ${syncDate}. \`tokens.css\` is built from \`tokens.json\` with \`tokensToCss\`.`,
  "",
  "Don't edit them here. Change SewAndSo, then run the sync again.",
  "",
  "| File | sha256 |",
  "|---|---|",
  ...rows,
  "",
].join("\n")
writeFileSync(new URL("SOURCE.md", target), sourceNote)

console.log(`Synced ${Object.keys(files).length} files and SOURCE.md into src/design/sewandso/`)
