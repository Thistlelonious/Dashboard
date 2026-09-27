export type UnitFamily = "length" | "weight" | "volume" | "count"

type UnitInfo = { family: UnitFamily; perBase: number; singular: string; plural: string }

// Each size is in its family's base: inches, ounces, teaspoons, or each. An inch is exactly 2.54 cm and a pound
// is exactly 453.59237 g, which fixes the metric sizes.
export const units = {
  yd: { family: "length", perBase: 36, singular: "yard", plural: "yards" },
  in: { family: "length", perBase: 1, singular: "inch", plural: "inches" },
  m: { family: "length", perBase: 100 / 2.54, singular: "meter", plural: "meters" },
  cm: { family: "length", perBase: 1 / 2.54, singular: "centimeter", plural: "centimeters" },
  lb: { family: "weight", perBase: 16, singular: "pound", plural: "pounds" },
  oz: { family: "weight", perBase: 1, singular: "ounce", plural: "ounces" },
  kg: { family: "weight", perBase: (1000 * 16) / 453.59237, singular: "kilogram", plural: "kilograms" },
  g: { family: "weight", perBase: 16 / 453.59237, singular: "gram", plural: "grams" },
  cup: { family: "volume", perBase: 48, singular: "cup", plural: "cups" },
  tbsp: { family: "volume", perBase: 3, singular: "tablespoon", plural: "tablespoons" },
  tsp: { family: "volume", perBase: 1, singular: "teaspoon", plural: "teaspoons" },
  "fl oz": { family: "volume", perBase: 6, singular: "fluid ounce", plural: "fluid ounces" },
  each: { family: "count", perBase: 1, singular: "each", plural: "each" },
} satisfies Record<string, UnitInfo>

export type Unit = keyof typeof units

export type CrossConversion = { from: string; to: string; factor: number }

export type Converted = { ok: true; qty: number } | { ok: false; message: string }

export function isUnit(text: string): text is Unit {
  return Object.hasOwn(units, text)
}

export function unitName(unit: string, count: "singular" | "plural"): string {
  return isUnit(unit) ? units[unit][count] : unit
}

function toTwelveDigits(qty: number): number {
  return Number(qty.toPrecision(12))
}

function withinFamily(qty: number, from: Unit, to: Unit): number {
  return (qty * units[from].perBase) / units[to].perBase
}

export function convert(qty: number, from: string, to: string, item: { crossConversion?: CrossConversion }): Converted {
  if (!isUnit(from)) return { ok: false, message: `${from} isn't a unit coinvoice knows` }
  if (!isUnit(to)) return { ok: false, message: `${to} isn't a unit coinvoice knows` }
  if (units[from].family === units[to].family) return { ok: true, qty: toTwelveDigits(withinFamily(qty, from, to)) }

  const bridge = item.crossConversion
  if (bridge !== undefined && isUnit(bridge.from) && isUnit(bridge.to)) {
    const [bridgeFrom, bridgeTo] = [bridge.from, bridge.to]
    if (units[bridgeFrom].family === units[from].family && units[bridgeTo].family === units[to].family) {
      return { ok: true, qty: toTwelveDigits(withinFamily(withinFamily(qty, from, bridgeFrom) * bridge.factor, bridgeTo, to)) }
    }
    if (units[bridgeTo].family === units[from].family && units[bridgeFrom].family === units[to].family) {
      return { ok: true, qty: toTwelveDigits(withinFamily(withinFamily(qty, from, bridgeTo) / bridge.factor, bridgeFrom, to)) }
    }
  }
  return { ok: false, message: `${units[from].plural} can't be turned into ${units[to].plural} for this item` }
}
