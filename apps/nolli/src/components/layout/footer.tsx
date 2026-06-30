import { Link } from "react-router"
import { Body2 } from "@nolli/ui"
import styles from "./footer.module.css"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Body2 className={styles.copyright}>
          © 2026-present Zane Chen
      </Body2>
      <Body2 className={styles.dot} aria-hidden="true">·</Body2>
      <Body2 asChild>
        <Link to="/privacy" className={styles.link}>Privacy</Link>
      </Body2>
      <Body2 className={styles.dot} aria-hidden="true">·</Body2>
      <Body2 asChild>
        <Link to="/terms" className={styles.link}>Terms</Link>
      </Body2>
    </footer>
  )
}
