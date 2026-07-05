// apps/poster/src/hooks/use-frame-size.ts
import { useEffect, useState } from "react"

export type FrameSize = {
  width: number
  height: number
  headerHeight: number
}

const EMPTY: FrameSize = { width: 0, height: 0, headerHeight: 0 }

/**
 * Live pixel size of the poster frame (`[data-poster-frame]`) and its header
 * child (`[data-poster-header]`), via a single ResizeObserver. Returns zeroes
 * until measured; callers clamp against zero. Re-measures on resize so the
 * image-strip bounds (45% caps, −header) stay exact.
 */
export function useFrameSize(): FrameSize {
  const [size, setSize] = useState<FrameSize>(EMPTY)

  useEffect(() => {
    const frame = document.querySelector<HTMLElement>("[data-poster-frame]")
    const header = document.querySelector<HTMLElement>("[data-poster-header]")
    if (!frame) return

    const measure = () => {
      const fr = frame.getBoundingClientRect()
      const hd = header?.getBoundingClientRect().height ?? 0
      setSize({ width: fr.width, height: fr.height, headerHeight: hd })
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    if (header) ro.observe(header)
    return () => ro.disconnect()
  }, [])

  return size
}
