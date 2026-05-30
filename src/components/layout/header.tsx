import { ThemeToggle } from "@/components/layout/theme-toggle"
import styles from "./header.module.css"
import { useNavigate } from "react-router"

export function Header() {
  const navigation = useNavigate()
  
  return (
    <header className={styles.header}>
      <div className={styles.left}/>
      <div className={styles.title} onClick={() => navigation("/")}>
        <img src="/favicon.svg" alt="Nolli Icon"  className={styles.icon} />
        Nolli
      </div>
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  )
}
