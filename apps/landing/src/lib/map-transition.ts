import { animate } from "framer-motion"
import type MapLibreGL from "maplibre-gl"
import { flyToSceneCinematic, type SceneCamera } from "@nolli/map"

export type TransitionMode = "fly" | "snapshot"

/** close enough to glide: centers within this fraction of the viewport's
 *  min side and under this much zoom change */
const NEAR_MAX_ZOOM_DELTA = 5
const NEAR_MAX_SCREEN_FRACTION = 1

const BLUR_PX = 24
const VEIL_PAD_PX = BLUR_PX * 5
const BLUR_UP_S = 0.15
const DISSOLVE_S = 0.15
const IDLE_TIMEOUT_MS = 1000

/** Mode for a transition, from the target's screen-space distance to the
 *  current view center and its zoom delta. Pure — the caller measures. */
export function transitionMode(screenPx: number, minSidePx: number, zoomDelta: number): TransitionMode {
  if (Math.abs(zoomDelta) > NEAR_MAX_ZOOM_DELTA) return "snapshot"
  if (screenPx > minSidePx * NEAR_MAX_SCREEN_FRACTION) return "snapshot"
  return "fly"
}

/** one transition at a time — a second fire while one runs just lands
 *  instantly; jumpTo can't mis-land, so latest intent is already on screen */
let busy = false

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
 *  kernel only ever samples real map content (see VEIL_PAD_PX). The
 *  visible interior stays pixel-exact against the live map. Needs the
 *  map created with preserveDrawingBuffer. */
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

/** Far transition: freeze the old view as an image, blur it up, jump +
 *  load tiles unseen, then dissolve the frozen frame away to the settled
 *  map (pure fade at held blur — a blur ramp-down would show the tiles
 *  loading through it). */
async function snapshotTransition(map: MapLibreGL.Map, cam: SceneCamera): Promise<void> {
  const img = document.createElement("img")
  img.src = paddedSnapshot(map.getCanvas())
  Object.assign(img.style, {
    position: "absolute",
    left: `${-VEIL_PAD_PX}px`, top: `${-VEIL_PAD_PX}px`,
    width: `calc(100% + ${2 * VEIL_PAD_PX}px)`, height: `calc(100% + ${2 * VEIL_PAD_PX}px)`,
    objectFit: "cover",
    // above scene markers too (they sit at z up to 100000) — the veil
    // covers the whole departing view
    zIndex: "2147483000", pointerEvents: "none",
  })
  map.getContainer().appendChild(img)
  try {
    await animate(img, { filter: `blur(${BLUR_PX}px)` }, { duration: BLUR_UP_S })
    map.jumpTo({ center: cam.center, zoom: cam.zoom })
    await onceIdle(map, IDLE_TIMEOUT_MS)
    await animate(img, { opacity: 0 }, { duration: DISSOLVE_S })
  } finally {
    img.remove()
  }
}

/** Run the scene transition the camera distance calls for. */
export function applyMapTransition(map: MapLibreGL.Map, cam: SceneCamera): void {
  const target = map.project(cam.center)
  const { clientWidth, clientHeight } = map.getContainer()
  const dx = target.x - clientWidth / 2
  const dy = target.y - clientHeight / 2
  const mode = transitionMode(Math.hypot(dx, dy), Math.min(clientWidth, clientHeight), cam.zoom - map.getZoom())
  if (mode === "fly") {
    flyToSceneCinematic(map, cam)
    return
  }
  if (busy) {
    map.jumpTo({ center: cam.center, zoom: cam.zoom })
    return
  }
  busy = true
  snapshotTransition(map, cam).finally(() => { busy = false })
}
