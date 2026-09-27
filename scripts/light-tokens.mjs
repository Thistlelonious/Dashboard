import { readFileSync } from "node:fs"

const tokensCss = new URL("../src/design/sewandso/tokens.css", import.meta.url)

export function lightToken(name) {
  const light = readFileSync(tokensCss, "utf8").match(/:root, \[data-theme="light"\] \{([^}]*)\}/)
  if (light === null) throw new Error("tokens.css has no Light block")
  const values = new Map([...light[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]))
  let value = values.get(name)
  for (let reference = value?.match(/^var\(--([\w-]+)\)$/); reference; reference = value?.match(/^var\(--([\w-]+)\)$/)) {
    value = values.get(reference[1])
  }
  if (value === undefined) throw new Error(`tokens.css has no Light --${name}`)
  return value
}
