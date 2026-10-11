// The selected city — one shared value the city ledger's cubes write and
// the hero sheet reads, so both scenes always sit on the same city.
// Starts on the hero's random pick; a ledger selection (pick or
// auto-advance) re-targets both at once — the map flies while the city
// hold owns it, and the hero sheet shows that city on the way back up.
import { useSyncExternalStore } from "react"
import { landingData } from "@/lib/landing-data"

let current = landingData.heroCity.name
const subs = new Set<() => void>()

export const selectedCity = (): string => current

export function setSelectedCity(name: string): void {
  if (name === current) return
  current = name
  for (const s of subs) s()
}

export function useSelectedCity(): string {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    selectedCity,
  )
}
