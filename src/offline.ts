import { registerSW } from "virtual:pwa-register"

export function workOffline() {
  // navigator.serviceWorker exists only on https and localhost, like navigator.storage.
  if (navigator.serviceWorker === undefined) return
  void registerSW({ immediate: true })
  void whenControlled().then(cacheFonts)
}

function whenControlled(): Promise<void> {
  if (navigator.serviceWorker.controller !== null) return Promise.resolve()
  return new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }))
}

// The first visit fetches Figtree before the service worker controls the page, so the worker never saw it.
// Fetching it again through the worker puts it in the font cache, and text keeps its font offline.
async function cacheFonts() {
  const fontSheets = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .flatMap((rule) => (rule instanceof CSSImportRule && rule.href.startsWith("https://fonts.googleapis.com/") ? [rule.href] : []))
  for (const href of fontSheets) {
    const css = await (await fetch(href)).text()
    const fonts = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(([, url]) => url)
    await Promise.all(fonts.map((url) => fetch(url)))
  }
}
