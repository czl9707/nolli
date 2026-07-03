import { useUiStore } from "@/stores/ui"
import { Button, H6 } from "@nolli/ui"
import { ThemeToggle } from "./theme-toggle"
import { PreviewToggle } from "./preview-toggle"
import { ScreenshotButton } from "./screenshot-button"
import styles from "./header.module.css"

/**
 * Desktop-only top bar. The left slot holds the screenshot button — present
 * only in preview mode, since that's the screenshot-ready frame. The brand sits
 * in the center; preview + theme toggles on the right. The whole bar is inside
 * the captured `.inset`, so it appears in the downloaded poster image.
 */
export function Header() {
  const previewMode = useUiStore((s) => s.previewMode)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {previewMode && <ScreenshotButton />}
      </div>
      <H6 className={styles.title}>Nolli</H6>
      <div className={styles.right}>
        <PreviewToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
