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
    <header data-poster-header className={styles.header}>
      {/* The icon slots are kept (flex:1 spacers, center the brand); only the
          buttons inside are marked for exclusion at screenshot time so the
          downloaded poster shows the header bar + "Nolli" but no action icons. */}
      <div className={styles.left}>
        {previewMode && (
          <span data-poster-exclude>
            <ScreenshotButton />
          </span>
        )}
      </div>
      <H6 className={styles.title}>
        <img src="/favicon.svg" alt="" className={styles.icon} />
        Nolli
      </H6>
      <div className={styles.right}>
        <span data-poster-exclude>
          <PreviewToggle />
        </span>
        <span data-poster-exclude>
          <ThemeToggle />
        </span>
      </div>
    </header>
  )
}
