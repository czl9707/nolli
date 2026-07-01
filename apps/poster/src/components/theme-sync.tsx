import { useEffect } from "react"
import { useThemeStore } from "@nolli/ui"

/**
 * Bridges the theme store to the DOM: writes resolvedTheme to body[data-theme]
 * so the CSS-variable overrides in global.css (and the body[data-theme='dark']
 * blocks in component CSS modules) actually apply. Also follows OS scheme
 * changes while in "system" mode. Copy-adapted from nolli's ThemeSync.
 */
export function ThemeSync() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.body.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        const resolved = mq.matches ? "dark" : "light"
        document.body.dataset.theme = resolved
        useThemeStore.setState({ resolvedTheme: resolved })
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return null
}
