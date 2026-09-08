import { useEffect, useState } from "react"
import { APP_URL } from "./constants"

/** Visitor's country (ISO-2) from the worker's /api/whereami (Cloudflare
 *  request geo). Fires once on mount, aborts after 2s, fails silent —
 *  callers fall back to the worldwide copy. ?country=XX in the page URL
 *  overrides, for local testing away from Cloudflare. */
export function useWhereami(): string | null {
  const [country, setCountry] = useState<string | null>(() => {
    if (typeof location === "undefined") return null
    return new URLSearchParams(location.search).get("country")
  })

  useEffect(() => {
    const override = new URLSearchParams(location.search).get("country")
    if (override) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2000)
    fetch(`${APP_URL}/api/whereami`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { country?: string | null } | null) => {
        if (body?.country) setCountry(body.country)
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer))
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  return country
}

/** ISO-2 code → display name ("FR" → "France"); the raw code on any gap. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}
