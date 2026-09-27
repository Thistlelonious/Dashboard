import { useEffect, useState, useSyncExternalStore } from "react"
import { store } from "./store.ts"

// `key` names what `read` fetches, so a new key drops the old value instead of showing it under the new one.
export function useStored<T>(read: () => Promise<T>, key: string): T | undefined {
  const version = useSyncExternalStore(store.subscribe, store.version)
  const [loaded, setLoaded] = useState<{ key: string; value: T }>()

  useEffect(() => {
    let current = true
    void read().then((value) => {
      if (current) setLoaded({ key, value })
    })
    return () => {
      current = false
    }
    // `read` is a new closure each render; `key` and `version` are what decide a re-read.
  }, [key, version])

  return loaded?.key === key ? loaded.value : undefined
}
