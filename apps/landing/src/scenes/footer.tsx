import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** Footer (prototype G "end of the map") — normal-flow cream block after the
 * stage spacers, rising over the pinned south ocean. The stage mounts this
 * scene in its overlay slot too; CSS keeps only the in-flow instance visible. */
export function FooterScene({ data }: { data: LandingData }) {
  return (
    <section className="footer-scene">
      <div className="footer-scene__annotation hand">
        <span>end of the map · 世界的尽头</span>
        <span className="footer-scene__coords">74° S · no pins from here on</span>
      </div>
      <div className="footer-scene__inner">
        <div className="footer-scene__brand">
          <span className="hand footer-scene__wordmark">Nolli</span>
          <span className="footer-scene__tagline">the architecture map</span>
        </div>
        <nav className="footer-scene__cols">
          <div>
            <p className="footer-scene__colhead">explore</p>
            <a href={APP_URL}>the map</a>
            <a href="#">the reel</a>
          </div>
          <div>
            <p className="footer-scene__colhead">elsewhere</p>
            <a href="#">instagram</a>
            <a href="#">contact</a>
          </div>
        </nav>
      </div>
      <div className="footer-scene__legal">
        <span>
          © 2026 Nolli · {data.stats.architectures} works · {data.stats.architects} architects
        </span>
        <span>one map, many roles</span>
      </div>
    </section>
  )
}
