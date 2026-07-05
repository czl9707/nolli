import { Moon, Sun } from "lucide-react"
import { useThemeStore } from "@nolli/ui"
import { Button } from "@nolli/ui"
import styles from "./theme-toggle.module.css"

export function ThemeToggle() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className={styles.sun} size={16} />
      <Moon className={styles.moon} size={16} />
      <span className={styles.srOnly}>Toggle theme</span>
    </Button>
  )
}
