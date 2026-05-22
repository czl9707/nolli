import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useTheme, type Theme, type ResolvedTheme } from "@/hooks/use-theme"

const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
}>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <ThemeHotkey resolvedTheme={resolvedTheme} setTheme={setTheme} />
      {children}
    </ThemeContext.Provider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey({
  resolvedTheme,
  setTheme,
}: {
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])
  return null
}
