import { ThemeToggle } from "@/components/layout/theme-toggle"
import styles from "./header.module.css"

export function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.title}>Nolli</span>
      <div className={styles.spacer} />
      <ThemeToggle />
    </header>
  )
}
