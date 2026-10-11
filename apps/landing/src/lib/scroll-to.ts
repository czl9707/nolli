// Programmatic scroll for the landing spine. Lenis eases native scroll
// for wheel input but doesn't own programmatic jumps — scrolling natively
// under it fights its internal target, so scenes route through here and
// spine-app hands over the live instance.

type LenisLike = { scrollTo: (target: number, options?: { duration?: number }) => void }

let lenis: LenisLike | null = null

/** spine-app registers the live Lenis (and nulls it on cleanup). */
export function registerLenis(instance: LenisLike | null): void {
  lenis = instance
}

/** Scroll the page to an absolute y. Instant under reduced motion. */
export function scrollToY(y: number): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, y)
    return
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.2 })
  else window.scrollTo({ top: y, behavior: "smooth" })
}
