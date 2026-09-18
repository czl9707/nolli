// Boot entrance sequence for the landing spine. One phase machine drives the
// whole overture: blank dark, headline enters, the map fades in under the
// closed veil (at the earlier of the 3s cap or the map's first idle, never
// before the headline hold), the grid furniture shows, the reveal plate
// opens with the accessories, then the scroll lock releases.
//
// BootProvider owns the machine; scenes read the phase via useBootPhase and
// gate their own entrances. The spine reports the map's first idle through
// setMapReady — the only input besides time.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { motion, useReducedMotion } from "framer-motion"

export const BOOT_PHASES = [
  "blank",
  "headline",
  "map",
  "furniture",
  "reveal",
  "done",
] as const

export type BootPhase = (typeof BOOT_PHASES)[number]

const BLANK_MS = 300
// the headline owns the stage until this absolute mark — the map phase
// never fires earlier, even on a warm cache
const HEADLINE_HOLD_MS = 1500
const MAP_CAP_MS = 3000
const AFTER_MAP_MS = 600
const AFTER_FURNITURE_MS = 600
const AFTER_REVEAL_MS = 600

export function phaseAtLeast(current: BootPhase, floor: BootPhase): boolean {
  return BOOT_PHASES.indexOf(current) >= BOOT_PHASES.indexOf(floor)
}

type BootCtx = {
  phase: BootPhase
  /** Report the map's first idle render — pulls the map phase in */
  setMapReady: () => void
}

const Ctx = createContext<BootCtx | null>(null)

export function BootProvider({ children }: { children: ReactNode }) {
  const [mapReady, setMapReadyFlag] = useState(false)
  const phase = useBootSequence(mapReady)
  const setMapReady = useCallback(() => setMapReadyFlag(true), [])
  const value = useMemo(() => ({ phase, setMapReady }), [phase, setMapReady])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Boot-sequence phase — scenes gate their entrances on this. Falls back to
 * "done" outside the provider (tests, standalone mounts). */
export function useBootPhase(): BootPhase {
  return useContext(Ctx)?.phase ?? "done"
}

/** Full boot context — for the reporter of the map's first idle (the spine) */
export function useBoot(): BootCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useBoot must be used within BootProvider")
  return ctx
}

function useBootSequence(mapReady: boolean): BootPhase {
  const [phase, setPhase] = useState<BootPhase>(() => {
    // debug override: ?boot=<phase> starts the machine at that phase, so
    // headless captures can see past the map-idle wait
    const v = new URLSearchParams(window.location.search).get("boot")
    return BOOT_PHASES.includes(v as BootPhase) ? (v as BootPhase) : "blank"
  })
  const t0 = useRef(performance.now())

  useEffect(() => {
    if (phase !== "blank") return
    const t = setTimeout(() => setPhase("headline"), BLANK_MS)
    return () => clearTimeout(t)
  }, [phase])

  // map: at the earlier of the 3s cap (measured from app load) or the map's
  // first idle — but not before the headline hold, so the headline keeps the
  // stage even on a warm cache
  useEffect(() => {
    if (phase !== "headline") return
    const elapsed = performance.now() - t0.current
    const cap = mapReady ? 0 : Math.max(0, MAP_CAP_MS - elapsed)
    const hold = Math.max(0, HEADLINE_HOLD_MS - elapsed)
    const t = setTimeout(() => setPhase("map"), Math.max(cap, hold))
    return () => clearTimeout(t)
  }, [phase, mapReady])

  useEffect(() => {
    if (phase !== "map") return
    const t = setTimeout(() => setPhase("furniture"), AFTER_MAP_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "furniture") return
    const t = setTimeout(() => setPhase("reveal"), AFTER_FURNITURE_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "reveal") return
    const t = setTimeout(() => setPhase("done"), AFTER_REVEAL_MS)
    return () => clearTimeout(t)
  }, [phase])

  return phase
}

const HIDDEN = { opacity: 0 }

// directional entrance offsets — furniture slides in from its own screen edge
const FROM = {
  up: { y: 16 },
  down: { y: -16 },
  left: { x: -24 },
  right: { x: 24 },
} as const

/** Boot-sequence entrance wrapper: renders from frame one at opacity 0 (so
 * layout is stable through the boot phases) and fades/rises in at the given
 * phase floor. Callers position it (className/style) — typically absolute
 * inset 0 inside the pane it fills. */
export function BootFade({
  at,
  children,
  className,
  style,
  from,
  delay,
}: {
  /** phase floor — the fade runs once the sequence reaches it */
  at: BootPhase
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /** entrance direction — the block rises from its own screen edge */
  from?: keyof typeof FROM
  /** stagger delay, for sequencing several BootFades inside one phase */
  delay?: number
}) {
  const reduced = useReducedMotion()
  const show = phaseAtLeast(useBootPhase(), at)
  const hidden = from ? {...HIDDEN, ...FROM[from] } : HIDDEN
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : hidden}
      animate={show ? { opacity: 1, x: 0, y: 0 } : hidden}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
