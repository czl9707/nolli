import { useEffect, useState } from "react"

const QUERY = "(max-width: 767px)"

/** Phone-viewport flag — the one gate scenes branch their mobile pane trees
 * and interactions on. Client-only app, so matchMedia is safe at init. */
export function useMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setMobile(mql.matches)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])
  return mobile
}
