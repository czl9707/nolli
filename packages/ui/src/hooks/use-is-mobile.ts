import { useSyncExternalStore } from "react"

const query = "(max-width: 720px)"

function subscribe(callback: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

/** Boolean mobile state from a single matchMedia query. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
