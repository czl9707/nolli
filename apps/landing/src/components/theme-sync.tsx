import { useEffect } from "react"
import { useThemeStore } from "@nolli/ui"

// Dark-locked (mechanics kept from round 1). Force the store at import time —
// before the map picks its initial style — then bridge resolvedTheme to
// body[data-theme]. Raw setState, not setTheme: no localStorage write that
// would bleed dark into the other apps on a shared origin.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" })

export function ThemeSync() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

  useEffect(() => {
    document.body.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  return null
}
