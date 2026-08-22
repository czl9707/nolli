import { useSyncExternalStore } from "react"

const query = "(max-width: 767px)"

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
