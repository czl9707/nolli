import { Moon, Sun } from "lucide-react"
import { useThemeContext } from "@/components/layout/theme-provider"
import { Button } from "@/components/ui/button"
import styles from "./theme-toggle.module.css"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className={styles.sun} />
      <Moon className={styles.moon} />
      <span className={styles.srOnly}>Toggle theme</span>
    </Button>
  )
}
