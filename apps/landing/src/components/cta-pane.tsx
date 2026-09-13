// Shared CTA pane (extracted from the hero's CtaPane). The whole pane is the
// CTA: two faces roll through the cell — resting (label over the sheet tile)
// and armed (accent ground, arrow). Desktop arms by cursor depth into the
// pane (the plate proxy sweeps in from the big cell, so the arming buffer
// guards the pane's left and top edges) or keyboard focus; mobile arms on
// the first tap and navigates on the second.
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type MotionValue } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Note, TRANSITION_SHORT } from "@nolli/ui"
import { APP_URL, ROLL_EASE } from "@/lib/constants"
import { useMobile } from "@/lib/use-mobile"
import styles from "./cta-pane.module.css"

const CTA_BUFFER = 90

export function CtaPane({
  sx,
  sy,
  href = APP_URL,
  label = "Explore Nolli",
}: {
  sx?: MotionValue<number>
  sy?: MotionValue<number>
  href?: string
  label?: string
}) {
  const mobile = useMobile()
  const ref = useRef<HTMLAnchorElement | null>(null)
  const [deep, setDeep] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tapped, setTapped] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (mobile || !sx || !sy) return
    let raf = 0
    const check = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = sx.get()
      const y = sy.get()
      const inDistance =
        x >= r.left + CTA_BUFFER &&
        x <= r.right &&
        y >= r.top + CTA_BUFFER &&
        y <= r.bottom
      setDeep(inDistance)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    schedule()
    return () => {
      u1()
      u2()
      window.removeEventListener("scroll", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sx, sy, mobile])
  const armed = mobile ? tapped : deep || focused
  // entry delay is for the boot roll only; later face swaps run immediately
  const booted = useRef(false)
  useEffect(() => {
    booted.current = true
  }, [])
  return (
    <motion.a
      ref={ref}
      data-armed={armed}
      className={styles.ctaPane}
      href={href}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={(e) => {
        if (mobile && !armed) {
          e.preventDefault()
          setTapped(true)
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={armed ? "armed" : "rest"}
          className={styles.ctaFace}
          data-armed={armed}
          initial={
            reduced
              ? false
              : booted.current
                ? { y: "100%" }
                : { opacity: 0, y: 10, filter: "blur(4px)" }
          }
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={reduced ? undefined : { y: "-100%" }}
          transition={
            booted.current
              ? { duration: TRANSITION_SHORT, ease: ROLL_EASE }
              : { duration: TRANSITION_SHORT, delay: 0.85, ease: "easeOut" }
          }
        >
          <Note className={styles.ctaText}>
            {label}
            <ArrowUpRight className={styles.ctaIcon} size={24} aria-hidden />
          </Note>
        </motion.span>
      </AnimatePresence>
    </motion.a>
  )
}
