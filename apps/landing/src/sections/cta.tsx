import type { LandingData } from "@/lib/landing-data"
import { MapStage } from "@/components/map-stage"

const WORLD_CAMERA = { center: [15, 32] as [number, number], zoom: 1.15 }
const APP_URL = "https://nolli-map.com"

export function CtaBookend({ data }: { data: LandingData }) {
  return (
    <section className="stage cta-bookend">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
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

/** The app itself: full map + app chrome, CTA injected. */
export function CtaAppHome({ data }: { data: LandingData }) {
  return (
    <section className="stage cta-app">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <header className="cta-app__header">
        <span className="cta-app__wordmark">Nolli</span>
        <a className="cta-app__ghost" href={APP_URL}>
          open app →
        </a>
      </header>
      <div className="cta-app__center">
        <h2 className="cta-app__h2">Open the Map.</h2>
        <p className="cta-app__sub">
          {data.stats.architectures} works · {data.stats.architects} architects · free
        </p>
        <a className="cta-app__btn" href={APP_URL}>
          Open Nolli →
        </a>
      </div>
      <footer className="cta-app__bar">
        <span>the architecture map</span>
        <span>© 2026</span>
      </footer>
    </section>
  )
}

export function CtaPoster({ data }: { data: LandingData }) {
  return (
    <section className="stage cta-poster">
      <div className="cta-poster__grade" />
      <div className="cta-poster__sheet">
        <div className="cta-poster__map">
          <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
        </div>
        <div className="cta-poster__caption">
          <span className="hand">Nolli — The Architecture Map</span>
          <span>
            {data.stats.architectures} works · {data.stats.architects} architects
          </span>
        </div>
      </div>
      <a className="cta-poster__btn" href={APP_URL}>
        Open the Map →
      </a>
    </section>
  )
}
