import { forwardRef, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"
import { getMapStyle, Map, useMapPatterns, type MapRef } from "@nolli/map"
import { useIsMobile } from "@nolli/ui"
import styles from "./landing-map.module.css"

/** The veil canvas lives once, inside the map container — scenes paint it
 * (the hero's brush) rather than re-creating a veil of their own. */
export const MAP_VEIL_ID = "spine-map-veil"

/** The veil wash color — the theme's primary background at the veil's
 * strength. Resolved from an element inside the tree: the theme declares
 * its tokens on body[data-theme], so reading off documentElement misses
 * them; the token is an "r g b" triplet. */
export function veilFill(el: Element): string {
  const triplet = getComputedStyle(el).getPropertyValue("--color-primary-background").trim()
  if (triplet) return `rgb(${triplet} / 0.92)`
  const bodyBg = getComputedStyle(document.body).backgroundColor
  return bodyBg !== "rgba(0, 0, 0, 0)" ? bodyBg : "rgba(23, 23, 23, 0.92)"
}

/** Full repaint of the veil canvas at its CSS size — the plain wash. The
 * component paints on mount and resize; the hero's brush repaints per
 * frame while it holds the map and once more on the way out, so any
 * stamps it left dissolve into the plain wash instead of lingering. */
export function paintVeil(c: HTMLCanvasElement) {
  const w = c.clientWidth
  const h = c.clientHeight
  if (!w || !h) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
  }
  const ctx = c.getContext("2d")
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = "source-over"
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = veilFill(c)
  ctx.fillRect(0, 0, w, h)
}

// Bare map for the spine — no arch markers of its own; scenes render
// their marker sets as fixed overlays (photo-markers). The veil canvas
// is the component's own: always on above the canvas, under the scenes'
// marker overlays, covering exactly the map layer's rect — a fullscreen hold is
// veiled end to end, the stats card only on its shape. The wrapper stands
// pointer events down (no drag); marker css re-enables its own.

/** maplibre v5 pins the camera so the world's mercator band always covers
 * the viewport (the pole-range clamp floors the zoom at the container
 * fit, whatever renderWorldCopies says). The mobile world camera parks
 * BELOW that floor — the world fills the top of the viewport with the
 * band under it left void — so the clamp is dropped there. Private API;
 * survives resize. */
function unlockWorldClamp(m: MapRef) {
  ;(m.transform as unknown as { _helper: { _latRange: [number, number] | null } })._helper._latRange = null
}

export const LandingMap = forwardRef<
  MapRef,
  { children?: ReactNode }
>(function LandingMap({ children }, ref) {
  const mobile = useIsMobile()
  const mapRef = useRef<MapRef | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)

  const mapStyles = useMemo(
    () => ({ light: getMapStyle("light"), dark: getMapStyle("dark") }),
    []
  )

  // the veil mounts with the map's children (the Map gates them on the
  // client instance), so the paint rides the canvas's own ref callback;
  // resizes repaint through the wrapper's observer
  const setVeil = useCallback((c: HTMLCanvasElement | null) => {
    if (c) paintVeil(c)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      const c = document.getElementById(MAP_VEIL_ID)
      if (c instanceof HTMLCanvasElement) paintVeil(c)
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  const handleRef = useCallback(
    (m: MapRef | null) => {
      if (!m) return
      mapRef.current = m
      // the map is cinematic, not interactive — markers re-enable pointer
      // events on themselves, and gestures inside one must not move the map
      m.dragPan.disable()
      m.doubleClickZoom.disable()
      // Forward the maplibre instance to the consumer's ref.
      if (typeof ref === "function") ref(m)
      else if (ref) ref.current = m
      if (mobile) unlockWorldClamp(m)
      initialize(m)
    },
    [initialize, ref, mobile]
  )
  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Map
        ref={handleRef}
        styles={mapStyles}
        // the mobile world holds zoom out past the default floor (0) to fit
        // the whole ledger span in a narrow band
        minZoom={-2}
        // copies:false clamps the camera inside the single world copy — on
        // mobile the world camera parks below that single-copy floor (see
        // unlockWorldClamp), so copies come back on there; the mobile
        // world never shows a second copy — the sides tile beyond the
        // crop, not on screen
        renderWorldCopies={mobile}
        loading={!patternReady}
        canvasContextAttributes={{ preserveDrawingBuffer: true }}>
        <canvas id={MAP_VEIL_ID} ref={setVeil} className={styles.veil} aria-hidden />
        {children}
      </Map>
    </div>
  )
})
