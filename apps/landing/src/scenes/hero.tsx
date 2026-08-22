import type { LandingData } from "@/lib/landing-data"

/** Hero overlay (prototype D, diagonal grade) — the stage's map layer is the background. */
export function HeroScene({ data }: { data: LandingData }) {
  return (
    <section className="hero-leftgrade">
      <div className="hero-leftgrade__grade" />
      <div className="hero-leftgrade__copy">
        <p className="hand hero-leftgrade__overline">
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h1 className="hero-leftgrade__h1">A Map Architects Wish For</h1>
        <p className="hero-leftgrade__sub">
          Nolli is an interactive figure-ground architecture map. Every work pinned where it
          stands.
        </p>
      </div>
      <div className="hero-leftgrade__marginalia hand">
        <span>48.8606° N · 2.3522° E</span>
        <span className="hero-leftgrade__tick">+</span>
        <span>Fig. 1 — The World</span>
      </div>
    </section>
  )
}
