import type MapLibreGL from "maplibre-gl"
import { type SceneCamera } from "@nolli/map"

/** Every scene transition runs the jump flow, sequenced with the spine's
 * shape morph: freeze the old view as an image, blur it up (css
 * transition, over the morph window's start), hold the blurred frame
 * while the layer morphs to the next pane (SNAPSHOT_SHAPE_MS — the frame
 * rides the layer, so the morph reads as the blurred map reshaping), then
 * jump, let tiles load unseen, and fade the frame out to the settled
 * map. */
export const SNAPSHOT_SHAPE_MS = 500

const BLUR_PX = 24
const VEIL_PAD_PX = BLUR_PX * 5
const BLUR_UP_S = 0.15
const DISSOLVE_S = 0.15
const IDLE_TIMEOUT_MS = 1000
/** Dim on the snapshot image: the capture sees the bare canvas, not the
 * scene's dim veil (a DOM layer above it), so the blurred frame would
 * flash bright against the veiled map around it. */
const SNAPSHOT_BRIGHTNESS = 0.8

function onceIdle(map: MapLibreGL.Map, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const fire = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      map.off("idle", fire)
      resolve()
    }
    const timer = setTimeout(fire, timeoutMs)
    map.once("idle", fire)
  })
}

/** Snapshot the canvas mirror-extended into a wide padding so the blur
 * kernel only ever samples real map content (see VEIL_PAD_PX). The
 * visible interior stays pixel-exact against the live map. Needs the
 * map created with preserveDrawingBuffer. */
function paddedSnapshot(canvas: HTMLCanvasElement): string {
  const dpr = window.devicePixelRatio || 1
  const p = Math.round(VEIL_PAD_PX * dpr)
  const W = canvas.width, H = canvas.height
  const out = document.createElement("canvas")
  out.width = W + 2 * p
  out.height = H + 2 * p
  const ctx = out.getContext("2d")!
  ctx.translate(p, p)
  const band = (fx: number, fy: number, tx: number, ty: number) => {
    ctx.save()
    ctx.translate(tx ? 2 * W : 0, ty ? 2 * H : 0)
    ctx.scale(fx, fy)
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()
  }
  band(-1, 1, 0, 0)                          // left
  band(-1, 1, 1, 0)                          // right
  band(1, -1, 0, 0)                          // top
  band(1, -1, 0, 1)                          // bottom
  band(-1, -1, 0, 0); band(-1, -1, 1, 0)    // corners: tl / tr
  band(-1, -1, 0, 1); band(-1, -1, 1, 1)    // bl / br
  ctx.drawImage(canvas, 0, 0)
  return out.toDataURL()
}

// One veil at a time. `gen` supersedes: a fire while a sequence is mid-run
// re-targets the jump instead of letting the old sequence jump to a stale
// destination afterwards; the current generation owns the veil and its
// removal.
let gen = 0
let veil: HTMLImageElement | null = null

async function snapshotTransition(map: MapLibreGL.Map, cam: SceneCamera, myGen: number): Promise<void> {
  const stale = () => myGen !== gen
  try {
    if (!veil) {
      veil = document.createElement("img")
      Object.assign(veil.style, {
        position: "absolute",
        left: `${-VEIL_PAD_PX}px`, top: `${-VEIL_PAD_PX}px`,
        width: `calc(100% + ${2 * VEIL_PAD_PX}px)`, height: `calc(100% + ${2 * VEIL_PAD_PX}px)`,
        objectFit: "cover",
        // above scene markers too (they sit at z up to 100000) — the veil
        // covers the whole departing view
        zIndex: "2147483000", pointerEvents: "none",
        transition: `filter ${BLUR_UP_S}s ease-out, opacity ${DISSOLVE_S}s ease-out`,
      })
      veil.src = paddedSnapshot(map.getCanvas())
      map.getContainer().appendChild(veil)
      // force style resolution so the blur-up transition runs from none
      veil.getBoundingClientRect()
      veil.style.filter = `blur(${BLUR_PX}px) brightness(${SNAPSHOT_BRIGHTNESS})`
    }
    await new Promise((r) => setTimeout(r, SNAPSHOT_SHAPE_MS))
    if (stale()) return
    map.jumpTo({ center: cam.center, zoom: cam.zoom })
    await onceIdle(map, IDLE_TIMEOUT_MS)
    if (stale()) return
    veil.style.opacity = "0"
    await new Promise((r) => setTimeout(r, DISSOLVE_S * 1000))
  } finally {
    if (!stale() && veil) {
      veil.remove()
      veil = null
    }
  }
}

/** Run the transition; the camera jump lands exactly when the spine's
 * shape morph (SNAPSHOT_SHAPE_MS) completes. */
export function applyMapTransition(map: MapLibreGL.Map, cam: SceneCamera): void {
  gen++
  snapshotTransition(map, cam, gen)
}
