import type { LandingData } from "@/lib/landing-data"
import { MapStage } from "@/components/map-stage"

const WORLD_CAMERA = { center: [15, 32] as [number, number], zoom: 1.15 }
const APP_URL = "https://nolli-map.com"

export function FooterMain() {
  return (
    <section className="stage footer-main">
      <div className="footer-main__inner">
        <div className="footer-main__brand">
          <span className="hand footer-main__wordmark">Nolli</span>
          <span className="footer-main__tagline">the architecture map</span>
        </div>
        <nav className="footer-main__cols">
          <div>
            <p className="footer-main__colhead">explore</p>
            <a href="#">the map</a>
            <a href="#">the reel</a>
          </div>
          <div>
            <p className="footer-main__colhead">elsewhere</p>
            <a href="#">instagram</a>
            <a href="#">contact</a>
          </div>
        </nav>
      </div>
      <div className="footer-main__legal">
        <span>© 2026 Nolli</span>
        <span>one map, many roles</span>
      </div>
    </section>
  )
}

/** Concept: map colophon — the credit block printed in the margin of an atlas plate. */
export function FooterColophon({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-colophon">
      <div className="footer-colophon__inner">
        <div className="footer-colophon__block">
          <span className="hand footer-colophon__wordmark">Nolli</span>
          <p className="footer-colophon__tagline">the architecture map</p>
        </div>
        <div className="footer-colophon__cols">
          <div>
            <p className="footer-colophon__head">edition</p>
            <p>first · 2026</p>
            <p>
              {data.stats.architectures} works · {data.stats.architects} architects
            </p>
            <p>figure-ground, maplibre</p>
          </div>
          <div>
            <p className="footer-colophon__head">elsewhere</p>
            <a href="#">instagram</a>
            <a href="#">contact</a>
          </div>
        </div>
        <div className="footer-colophon__scale">
          <div className="footer-colophon__scalebar" />
          <span className="footer-colophon__scalelabel">500 km</span>
        </div>
      </div>
      <div className="footer-colophon__legal">
        <span>© 2026 Nolli</span>
        <span>printed nowhere — drawn everywhere</span>
      </div>
    </section>
  )
}

/** Concept: roll credits — reel heritage, centered lines, small type. */
export function FooterCredits({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-credits">
      <div className="footer-credits__col">
        <span className="hand footer-credits__wordmark">Nolli</span>
        <p>a map architects wish for</p>
        <p>
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <p className="footer-credits__dim">figure-ground tiles © carto · rendered with maplibre</p>
        <div className="footer-credits__links">
          <a href="#">the map</a>
          <span>·</span>
          <a href="#">instagram</a>
          <span>·</span>
          <a href="#">contact</a>
        </div>
      </div>
      <div className="footer-credits__legal">© 2026 Nolli</div>
    </section>
  )
}

/** Concept: the CTA's diagonal continues past the fold as a real seam —
    footer content lives in the dark triangle below it. */
export function FooterDiagonal({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-diagonal">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="footer-diagonal__block">
        <div className="footer-diagonal__content">
          <div className="footer-diagonal__brand">
            <span className="hand footer-diagonal__wordmark">Nolli</span>
            <span className="footer-diagonal__tagline">the architecture map</span>
          </div>
          <nav className="footer-diagonal__links">
            <a href={APP_URL}>the map</a>
            <a href="#">the reel</a>
            <a href="#">instagram</a>
            <a href="#">contact</a>
          </nav>
        </div>
        <div className="footer-diagonal__legal">
          <span>
            © 2026 Nolli · {data.stats.architectures} works · {data.stats.architects} architects
          </span>
          <span>one map, many roles</span>
        </div>
      </div>
    </section>
  )
}

/** Concept: the map never ends — it tucks under a solid letterbox strip. */
export function FooterLetterbox({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-letterbox">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="footer-letterbox__grade" />
      <div className="footer-letterbox__cta">
        <h2 className="footer-letterbox__h2">Open the Map.</h2>
      </div>
      <div className="footer-letterbox__strip">
        <span className="hand footer-letterbox__wordmark">Nolli</span>
        <nav className="footer-letterbox__links">
          <a href={APP_URL}>the map</a>
          <a href="#">the reel</a>
          <a href="#">instagram</a>
          <a href="#">contact</a>
        </nav>
        <span className="footer-letterbox__legal">© 2026 Nolli</span>
      </div>
    </section>
  )
}

/** Concept: ghost map void — near-black, map barely there, tiny centered colophon. */
export function FooterGhost({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-ghost">
      <div className="footer-ghost__map">
        <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      </div>
      <div className="footer-ghost__col">
        <span className="hand footer-ghost__wordmark">Nolli</span>
        <p>the architecture map</p>
        <p className="footer-ghost__dim">
          {data.stats.architectures} works · {data.stats.architects} architects · maplibre
        </p>
        <div className="footer-ghost__links">
          <a href={APP_URL}>the map</a>
          <span>·</span>
          <a href="#">instagram</a>
          <span>·</span>
          <a href="#">contact</a>
        </div>
      </div>
      <div className="footer-ghost__legal">© 2026 Nolli</div>
    </section>
  )
}

/** Concept: end of the map — camera somewhere far south, no pins left.
    Footer block covers the map's bottom edge (E), content laid out like A. */
export function FooterEndOfMap({ data }: { data: LandingData }) {
  return (
    <section className="stage footer-end">
      <MapStage summaries={[]} center={[-15, -72]} zoom={3.1} />
      <div className="footer-end__annotation hand">
        <span>end of the map · 世界的尽头</span>
        <span className="footer-end__coords">74° S · no pins from here on</span>
      </div>
      <div className="footer-end__block">
        <div className="footer-end__inner">
          <div className="footer-end__brand">
            <span className="hand footer-end__wordmark">Nolli</span>
            <span className="footer-end__tagline">the architecture map</span>
          </div>
          <nav className="footer-end__cols">
            <div>
              <p className="footer-end__colhead">explore</p>
              <a href={APP_URL}>the map</a>
              <a href="#">the reel</a>
            </div>
            <div>
              <p className="footer-end__colhead">elsewhere</p>
              <a href="#">instagram</a>
              <a href="#">contact</a>
            </div>
          </nav>
        </div>
        <div className="footer-end__legal">
          <span>
            © 2026 Nolli · {data.stats.architectures} works · {data.stats.architects} architects
          </span>
          <span>one map, many roles</span>
        </div>
      </div>
    </section>
  )
}
