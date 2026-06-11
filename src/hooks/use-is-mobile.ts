import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 720

function subscribe(callback: () => void) {
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
