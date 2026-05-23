import { Body2 } from "@/components/ui/typography"
import styles from "./footer.module.css"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Body2 className={styles.copyright}>
        © 2026-present Zane Chen. All Rights Reserved.
      </Body2>
    </footer>
  )
}
