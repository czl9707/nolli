import { useState } from "react"
import { toPng } from "html-to-image"
import { Camera } from "lucide-react"
import { Button } from "@nolli/ui"

/** Captures the poster frame — the header + map + photo overlay (`.inset`) —
 *  as a PNG and downloads it. Rendered in the header only while preview mode is
 *  on.
 *
 *  MapLibre's WebGL canvas is created with `preserveDrawingBuffer: true` (via
 *  <ArchMap capture>), without which the tiles would read back blank. */
export function ScreenshotButton() {
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    const node = document.querySelector<HTMLElement>("[data-poster-frame]")
    if (!node || busy) return
    setBusy(true)
    try {
      const dataUrl = await toPng(node)
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "nolli-poster.png"
      a.click()
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
    >
      <Camera size={18} />
    </Button>
  )
}
