import { useSyncExternalStore } from "react"

const query = "(max-width: 720px)"

function subscribe(callback: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

/** One-shot mobile check on the same query — for non-hook call sites. */
export function isMobile(): boolean {
  return window.matchMedia(query).matches
}

/** Boolean mobile state from a single matchMedia query. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    isMobile,
    () => false,
  )
}
