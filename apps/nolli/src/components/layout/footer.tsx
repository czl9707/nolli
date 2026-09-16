import { Body2 } from "@nolli/ui"
import { ABOUT_PAGE, PRIVACY_PAGE, TERMS_PAGE } from "@/lib/constants"
import styles from "./footer.module.css"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Body2 className={styles.copyright}>
          © 2026-present Zane Chen
      </Body2>
      <Body2 className={styles.dot} aria-hidden="true">·</Body2>
      <Body2 asChild>
        <a href={PRIVACY_PAGE} target="_blank" rel="noopener noreferrer" className={styles.link}>Privacy</a>
      </Body2>
      <Body2 className={styles.dot} aria-hidden="true">·</Body2>
      <Body2 asChild>
        <a href={TERMS_PAGE} target="_blank" rel="noopener noreferrer" className={styles.link}>Terms</a>
      </Body2>
    </footer>
  )
}
