import { useState } from "react"
import { toPng } from "html-to-image"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@nolli/ui"
import styles from "./screenshot-button.module.css"

/** Captures the poster frame — the header + map + photo overlay (`.inset`) —
 *  as a PNG and downloads it. Rendered in the header only while preview mode is
 *  on.
 *
 *  MapLibre's WebGL canvas is created with `preserveDrawingBuffer: true` (via
 *  <ArchMap capture>), without which the tiles would read back blank.
 *
 */
export function ScreenshotButton() {
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    const node = document.querySelector<HTMLElement>("[data-poster-frame]")
    if (!node || busy) return
    setBusy(true)
    try {
      const dataUrl = await toPng(node, {
        // Drop the header action icons (screenshot/preview/theme) from the
        // poster. They're wrapped in [data-poster-exclude] spans inside the
        // icon slots; the slots themselves are kept (flex:1 spacers) so the
        // "Nolli" brand stays centered. Returning false removes the node and
        // its subtree from the clone entirely — more reliable than hiding via
        // CSS/inline visibility, which html-to-image can drop in its off-DOM
        // render.
        filter: (n) => {
          if (!(n instanceof HTMLElement)) return true
          return !n.closest("[data-poster-exclude]")
        },
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "nolli-poster.png"
      a.click()
      // Flash after capture so the overlay never bleeds into the image.
      node.classList.remove(styles.flash)
      // Force reflow so re-adding the class replays the animation.
      void node.offsetWidth
      node.classList.add(styles.flash)
    } catch (err) {
      console.error("Poster screenshot failed:", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={busy}
      aria-label="Download poster image"
      aria-busy={busy}
    >
      {busy ? (
        <Loader2 size={18} className={styles.spin} />
      ) : (
        <Camera size={18} />
      )}
    </Button>
  )
}
