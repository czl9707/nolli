import { useEffect, useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion"

const MIN_THUMB = 36
const MARGIN = 8
const WIDTH = 3
const IDLE_MS = 800

/** Overlay scroll indicator. The native scrollbar is hidden in global.css
 * (it claimed layout width and shifted the viewport when it appeared), so
 * this thumb floats over the page's right edge instead: accent coloured,
 * no track, position driven by scroll progress through motion values so
 * scrolling never re-renders. Indicative only — wheel, touch, and keyboard
 * still do the scrolling. */
export function ScrollThumb() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const opacity = useMotionValue(reduced ? 1 : 0)
  const hostRef = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState(() => measure())

  // the spine's height changes when the stage mounts and on viewport
  // changes. body is height:100% (content overflows it), so observe the
  // auto-height main that actually grows
  useEffect(() => {
    const main = hostRef.current?.closest("main")
    if (!main) return
    const ro = new ResizeObserver(() => setGeo(measure()))
    ro.observe(main)
    return () => ro.disconnect()
  }, [])

  const y = useTransform(scrollYProgress, (p) => p * (geo.trackH - geo.thumbH))

  const fadeIdle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useMotionValueEvent(scrollYProgress, "change", () => {
    if (reduced) return
    opacity.set(1)
    clearTimeout(fadeIdle.current)
    fadeIdle.current = setTimeout(() => opacity.set(0), IDLE_MS)
  })
  useEffect(() => () => clearTimeout(fadeIdle.current), [])

  return (
    <motion.div
      aria-hidden
      ref={hostRef}
      style={{
        position: "fixed",
        right: MARGIN - 2,
        top: `calc(${MARGIN}px + var(--size-header-height))`,
        width: WIDTH,
        height: geo.thumbH,
        borderRadius: WIDTH,
        background: "var(--color-accent-foreground)",
        translateY: y,
        opacity,
        pointerEvents: "none",
        zIndex: 40,
      }}
    />
  )
}

function measure() {
  const doc = document.documentElement
  const trackH = window.innerHeight - MARGIN * 2 - (document.querySelector("header")?.getBoundingClientRect()?.height ?? 0);
  const contentH = Math.max(doc.scrollHeight, 1)
  const thumbH = Math.min(Math.max((window.innerHeight / contentH) * trackH, MIN_THUMB), trackH)
  return { trackH, thumbH }
}
