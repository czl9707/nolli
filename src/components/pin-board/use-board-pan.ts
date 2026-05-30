import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMotionValue, animate } from "framer-motion"
import { TRANSITION_SHORT } from "@/lib/animation"

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0
const BOARD_PAD = 200

// If the board is smaller than the viewport, center it. Otherwise clamp the pan
// so the user can reveal at most BOARD_PAD of empty space beyond each edge.
function clampPan(
  raw: number,
  boardSize: number,
  viewportSize: number
): number {
  return boardSize <= viewportSize
    ? (viewportSize - boardSize) / 2
    : Math.min(BOARD_PAD, Math.max(viewportSize - boardSize - BOARD_PAD, raw))
}

export function useBoardPan(
  canvasW: number,
  canvasH: number,
  isActive: boolean,
  viewportRef: React.RefObject<HTMLDivElement | null>
) {
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)
  const zoom = useMotionValue(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useMemo(() => ({ x: 0, y: 0 }), [])
  const viewportSize = useRef({ w: 0, h: 0 })
  const pointerDownPos = useRef({ x: 0, y: 0 })
  const suppressClick = useRef(false)

  // Smoothly animate pan/zoom to default positions when toggling between modes
  useEffect(() => {
    if (!isActive) {
      animate(panX, 0, { duration: TRANSITION_SHORT, ease: "easeInOut" })
      animate(panY, 0, { duration: TRANSITION_SHORT, ease: "easeInOut" })
      animate(zoom, 1, { duration: TRANSITION_SHORT, ease: "easeInOut" })
    } else {
      animate(panX, 0, { duration: TRANSITION_SHORT, ease: "easeInOut" })
      animate(panY, 0, { duration: TRANSITION_SHORT, ease: "easeInOut" })
    }
  }, [isActive, panX, panY, zoom])

  // Track viewport dimensions for edge clamping calculations
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      viewportSize.current = { w: width, h: height }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [viewportRef])

  // Capture-phase click handler: suppress clicks that follow a drag (3px+ movement).
  // This lets all child items (photos, links, overlays) work naturally — clicks pass
  // through, but drags that end on an item won't accidentally trigger its onClick.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      if (suppressClick.current) {
        e.stopPropagation()
        e.preventDefault()
        suppressClick.current = false
      }
    }
    el.addEventListener("click", handler, true)
    return () => el.removeEventListener("click", handler, true)
  }, [viewportRef])

  // Return individual motion values so framer-motion can coordinate them
  // with variant animations on the same element. A combined transform
  // string (MotionValue<string>) is opaque to framer-motion and can
  // fall a frame behind the variant-driven width/height animation.

  // preventDefault stops the browser's native drag (which would download images)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return
      e.preventDefault()
      suppressClick.current = false
      pointerDownPos.current = { x: e.clientX, y: e.clientY }
      setIsPanning(true)
      panStart.x = e.clientX - panX.get()
      panStart.y = e.clientY - panY.get()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isActive, panX, panY, panStart]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      // Mark as a drag once the pointer moves more than 3px from the press point
      if (!suppressClick.current) {
        const dx = Math.abs(e.clientX - pointerDownPos.current.x)
        const dy = Math.abs(e.clientY - pointerDownPos.current.y)
        if (dx > 3 || dy > 3) suppressClick.current = true
      }
      const { w, h } = viewportSize.current
      const z = zoom.get()
      const rawX = e.clientX - panStart.x
      const rawY = e.clientY - panStart.y
      panX.set(clampPan(rawX, canvasW * z, w))
      panY.set(clampPan(rawY, canvasH * z, h))
    },
    [isPanning, panX, panY, panStart, zoom, canvasW, canvasH]
  )

  const handlePointerUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Zoom anchored to the cursor position — the point under the mouse stays fixed
  // by adjusting pan proportionally: newPan = cursor - (cursor - oldPan) * (newZoom / oldZoom)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isActive) return
      const el = viewportRef.current
      if (!el) return
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const oldZoom = zoom.get()
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta))
      const { w, h } = viewportSize.current
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const scale = newZoom / oldZoom
      panX.set(clampPan(cx - (cx - panX.get()) * scale, canvasW * newZoom, w))
      panY.set(clampPan(cy - (cy - panY.get()) * scale, canvasH * newZoom, h))
      zoom.set(newZoom)
    },
    [isActive, zoom, panX, panY, canvasW, canvasH, viewportRef]
  )

  return {
    panX,
    panY,
    zoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  }
}
