import type { LandingData } from "@/lib/landing-data"
import { MapStage } from "@/components/map-stage"

const WORLD_CAMERA = { center: [15, 32] as [number, number], zoom: 1.15 }

export function HeroSurvey({ data }: { data: LandingData }) {
  return (
    <section className="stage hero-survey">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="hero-survey__grade" />
      <div className="hero-survey__copy">
        <p className="hand hero-survey__overline">
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h1 className="hero-survey__h1">A Map Architects Wish For</h1>
        <p className="hero-survey__sub">
          Nolli is an interactive figure-ground architecture map. Every work pinned where it
          stands.
        </p>
      </div>
      <div className="hero-survey__marginalia hand">
        <span>48.8606° N · 2.3522° E</span>
        <span className="hero-survey__tick">+</span>
        <span>Fig. 1 — The World</span>
      </div>
    </section>
  )
}

/** Same composition, grade as a left column instead of a bottom mass. */
export function HeroLeftGrade({ data }: { data: LandingData }) {
  return (
    <section className="stage hero-leftgrade">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
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

/** Same composition, uniform dim instead of a directional grade. */
export function HeroDim({ data }: { data: LandingData }) {
  return (
    <section className="stage hero-dim">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="hero-dim__grade" />
      <div className="hero-dim__copy">
        <p className="hand hero-dim__overline">
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h1 className="hero-dim__h1">A Map Architects Wish For</h1>
        <p className="hero-dim__sub">
          Nolli is an interactive figure-ground architecture map. Every work pinned where it
          stands.
        </p>
      </div>
      <div className="hero-dim__marginalia hand">
        <span>48.8606° N · 2.3522° E</span>
        <span className="hero-dim__tick">+</span>
        <span>Fig. 1 — The World</span>
      </div>
    </section>
  )
}

export function HeroPlate({ data }: { data: LandingData }) {
  return (
    <section className="stage hero-plate">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="hero-plate__scrim" />
      <div className="hero-plate__frame">
        <p className="hero-plate__plate-no">Plate I</p>
        <h1 className="hero-plate__h1">A Map Architects Wish For</h1>
        <p className="hero-plate__caption">
          The architecture map — {data.stats.architectures} works, pinned where they stand
        </p>
        <div className="hero-plate__stamp hand">NOLLI</div>
      </div>
    </section>
  )
}

export function HeroFieldnote({ data }: { data: LandingData }) {
  return (
    <section className="stage hero-fieldnote">
      <MapStage summaries={data.summaries} {...WORLD_CAMERA} />
      <div className="hero-fieldnote__grade" />
      <div className="hero-fieldnote__note card">
        <div className="hero-fieldnote__tape" />
        <h1 className="hand hero-fieldnote__h1">A Map Architects Wish For</h1>
        <p className="hero-fieldnote__sub">
          An interactive figure-ground architecture map. {data.stats.architectures} works ·{" "}
          {data.stats.architects} architects.
        </p>
      </div>
    </section>
  )
}
