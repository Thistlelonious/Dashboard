import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react"
import { store } from "./store.ts"

export function useStored<T>(read: () => Promise<T>, key: string): T | undefined {
  const version = useSyncExternalStore(store.subscribe, store.version)
  const [loaded, setLoaded] = useState<{ key: string; value: T }>()
  const readLatest = useEffectEvent(read)

  useEffect(() => {
    let current = true
    void readLatest().then((value) => {
      if (current) setLoaded({ key, value })
    })
    return () => {
      current = false
    }
  }, [key, version])

  return loaded?.key === key ? loaded.value : undefined
}
