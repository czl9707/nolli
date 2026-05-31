import { create } from "zustand"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemPreference() : theme
}

function applyTheme(resolved: ResolvedTheme) {
  document.body.dataset.theme = resolved
}

type ThemeState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  resolvedTheme: resolveTheme(getStoredTheme()),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme)
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },
}))
