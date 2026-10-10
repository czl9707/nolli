// The writer for the map lean: listens to the window pointer, eases the
// shared offset each frame, and publishes it on the root element as two
// custom properties (--map-lean-x / -y) that the spine's map wrapper
// consumes. The loop sleeps once the map settles; a leaving cursor eases
// it home. Reduced motion gets a still map; touch pointers never lean it
// (their moves are scrolls).
import { useEffect } from "react"
import { useReducedMotion } from "framer-motion"
import { easeToward, parallaxOffset, pointerNorm, settled, type Point } from "@/lib/map-lean"

export function MapLean() {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) return
    const root = document.documentElement
    let cur: Point = { x: 0, y: 0 }
    let target: Point = { x: 0, y: 0 }
    let raf = 0
    let looping = false
    let lastT = 0

    const write = () => {
      root.style.setProperty("--map-lean-x", cur.x.toFixed(2))
      root.style.setProperty("--map-lean-y", cur.y.toFixed(2))
    }
    const tick = (now: number) => {
      // a frame's timestamp can predate the scheduling performance.now()
      // (vsync of a frame already in flight) — a negative step would ease
      // AWAY from the target and diverge, so the floor is load-bearing
      const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000))
      lastT = now
      cur = easeToward(cur, target, dt)
      write()
      if (settled(cur, target)) {
        cur = target
        write()
        looping = false
        return
      }
      raf = requestAnimationFrame(tick)
    }
    const ensureLoop = () => {
      if (looping) return
      looping = true
      lastT = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      target = parallaxOffset(
        pointerNorm(e.clientX, e.clientY, window.innerWidth, window.innerHeight),
      )
      ensureLoop()
    }
    const onLeave = () => {
      target = { x: 0, y: 0 }
      ensureLoop()
    }

    write()
    window.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("mouseleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      looping = false
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      root.style.removeProperty("--map-lean-x")
      root.style.removeProperty("--map-lean-y")
    }
  }, [reduced])
  return null
}
