let request: Promise<boolean> | undefined

export function storageKept(): Promise<boolean> {
  request ??= askToKeepStorage()
  return request
}

async function askToKeepStorage(): Promise<boolean> {
  // navigator.storage exists only on https and localhost, so a phone on the dev server's LAN address has none.
  if (navigator.storage === undefined) return false
  return (await navigator.storage.persisted()) || navigator.storage.persist()
}
