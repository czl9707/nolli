import { useEffect } from "react"
import { useThemeStore } from "@/stores/theme"

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
