import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** CTA overlay (prototype A, hero-mirror grade) — the stage's map layer is the background. */
export function CtaScene({ data }: { data: LandingData }) {
  return (
    <section className="cta-bookend">
      <div className="cta-bookend__grade" />
      <div className="cta-bookend__copy">
        <p className="hand cta-bookend__overline">
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h2 className="cta-bookend__h2">Open the Map.</h2>
        <p className="cta-bookend__sub">free</p>
        <a className="cta-bookend__btn" href={APP_URL}>
          Open Nolli →
        </a>
      </div>
    </section>
  )
}
