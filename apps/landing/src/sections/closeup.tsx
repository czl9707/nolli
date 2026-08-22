import { useCallback, useEffect, useState } from "react"
import { useMap } from "@nolli/map"
import type { LandingData } from "@/lib/landing-data"
import { MapStage } from "@/components/map-stage"

/** Rendered inside MapStage children — jumps the live map when center changes. */
function MapJumper({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { map } = useMap()
  useEffect(() => {
    map?.jumpTo({ center, zoom })
  }, [map, center, zoom])
  return null
}

/** Per-arch settle offsets — the board re-scatters a little on each switch. */
const SCATTER = [
  { r: 0, dx: 0, dy: 0 },
  { r: -1.5, dx: 14, dy: 10 },
  { r: 2, dx: -16, dy: 6 },
  { r: -2.5, dx: 8, dy: -12 },
  { r: 1.5, dx: -10, dy: 14 },
]

/** PROTOTYPE placeholder until app deep links are verified. */
const APP_URL = "https://nolli-map.com"

export function CloseupBoardRotating({ data }: { data: LandingData }) {
  const set = data.boardSet
  const [i, setI] = useState(0)
  const go = useCallback(
    (d: number) => setI((v) => (v + d + set.length) % set.length),
    [set.length],
  )
  useEffect(() => {
    const t = window.setInterval(() => go(1), 5000)
    return () => window.clearInterval(t)
  }, [go, i])

  const arch = set[i]
  const s = SCATTER[i % SCATTER.length]
  const worksByArchitect = data.summaries.filter((x) => x.architect === arch.architect).length
  const ctaLabel =
    worksByArchitect >= 2 ? `more by ${arch.architect} →` : `more in ${arch.city} →`

  return (
    <section
      className="stage closeup-board closeup-rot"
      style={
        {
          "--b-r": `${s.r}deg`,
          "--b-dx": `${s.dx}px`,
          "--b-dy": `${s.dy}px`,
        } as React.CSSProperties
      }
    >
      <div className="closeup-rot__bg" />
      <div className="closeup-board__note card pin">
        <p className="hand closeup-board__notehand">want to dig more?</p>
        <p className="closeup-board__noteline">each architecture is a story.</p>
      </div>
      <div className="closeup-board__carousel card pin">
        <button type="button" onClick={() => go(-1)} aria-label="previous architecture">
          ←
        </button>
        <span className="hand closeup-board__carouselname">{arch.name}</span>
        <button type="button" onClick={() => go(1)} aria-label="next architecture">
          →
        </button>
        <span className="closeup-board__counter">
          {i + 1} / {set.length}
        </span>
      </div>
      <div className="card closeup-board__map">
        <MapStage
          summaries={[]}
          selectedSlug={arch.slug}
          center={[arch.coordinates.lng, arch.coordinates.lat]}
          zoom={data.heroCamera.zoom}
        >
          <MapJumper center={[arch.coordinates.lng, arch.coordinates.lat]} zoom={data.heroCamera.zoom} />
        </MapStage>
        <span className="closeup-board__maplabel hand" key={`label-${arch.slug}`}>
          site — {arch.address}
        </span>
        <div className="closeup-board__mapfade" key={`fade-${arch.slug}`} />
      </div>
      <figure className="card pin closeup-board__photo closeup-board__photo--1">
        <img key={arch.slug} src={arch.photos[0].image} alt={arch.name} />
        <figcaption className="hand closeup-board__photocaption" key={`${arch.slug}-c`}>
          {arch.name} · {arch.year}
        </figcaption>
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--2">
        <img key={arch.slug} src={arch.photos[1].image} alt={arch.name} />
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--3">
        <img key={arch.slug} src={arch.photos[2].image} alt={arch.name} />
      </figure>
      <div className="card pin closeup-board__meta">
        <div className="closeup-board__name">{arch.name}</div>
        <dl>
          <div>
            <dt>architect</dt>
            <dd>{arch.architect}</dd>
          </div>
          <div>
            <dt>year</dt>
            <dd>{arch.year}</dd>
          </div>
          <div>
            <dt>address</dt>
            <dd>{arch.address}</dd>
          </div>
        </dl>
        <a className="closeup-board__cta" href={APP_URL}>
          {ctaLabel}
        </a>
        <div className="closeup-board__links">
          <a href={arch.links?.wikipedia} target="_blank" rel="noreferrer">
            wikipedia ↗
          </a>
          <a href={arch.links?.googleMaps} target="_blank" rel="noreferrer">
            google maps ↗
          </a>
        </div>
      </div>
    </section>
  )
}

export function CloseupBoard({ data }: { data: LandingData }) {
  const { hero } = data
  return (
    <section className="stage closeup-board">
      <div className="closeup-board__bg" />
      <div className="closeup-board__note card pin">
        <p className="hand closeup-board__notehand">want to dig more?</p>
        <p className="closeup-board__noteline">each architecture is a story.</p>
      </div>
      <div className="closeup-board__map card">
        <MapStage
          summaries={[]}
          selectedSlug={hero.slug}
          center={[hero.coordinates.lng, hero.coordinates.lat]}
          zoom={data.heroCamera.zoom}
        />
        <span className="closeup-board__maplabel hand">site — {hero.address}</span>
      </div>
      <figure className="card pin closeup-board__photo closeup-board__photo--1">
        <img src={hero.photos[0].image} alt={hero.name} />
        <figcaption className="hand closeup-board__photocaption">
          {hero.name} · {hero.year}
        </figcaption>
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--2">
        <img src={hero.photos[1].image} alt={hero.name} />
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--3">
        <img src={hero.photos[2].image} alt={hero.name} />
      </figure>
      <div className="card pin closeup-board__meta">
        <dl>
          <div>
            <dt>architect</dt>
            <dd>{hero.architect}</dd>
          </div>
          <div>
            <dt>year</dt>
            <dd>{hero.year}</dd>
          </div>
          <div>
            <dt>address</dt>
            <dd>
              {hero.address}, {hero.city}
            </dd>
          </div>
        </dl>
        <div className="closeup-board__links">
          <a href={hero.links?.wikipedia} target="_blank" rel="noreferrer">
            wikipedia ↗
          </a>
          <a href={hero.links?.googleMaps} target="_blank" rel="noreferrer">
            google maps ↗
          </a>
        </div>
      </div>
    </section>
  )
}

export function CloseupDossier({ data }: { data: LandingData }) {
  const { hero } = data
  return (
    <section className="stage closeup-dossier">
      <figure className="closeup-dossier__photo">
        <img src={hero.photos[0].image} alt={hero.name} />
      </figure>
      <div className="closeup-dossier__col">
        <p className="hand closeup-dossier__overline">The Close-Up</p>
        <h2 className="closeup-dossier__statement">
          Want to dig more?
          <br />
          Each architecture is a story.
        </h2>
        <dl className="closeup-dossier__meta">
          <div>
            <dt>work</dt>
            <dd>{hero.name}</dd>
          </div>
          <div>
            <dt>architect</dt>
            <dd>{hero.architect}</dd>
          </div>
          <div>
            <dt>year</dt>
            <dd>{hero.year}</dd>
          </div>
          <div>
            <dt>address</dt>
            <dd>
              {hero.address}, {hero.city}, {hero.country}
            </dd>
          </div>
        </dl>
        <div className="closeup-dossier__inset">
          <MapStage
            summaries={[]}
            selectedSlug={hero.slug}
            center={[hero.coordinates.lng, hero.coordinates.lat]}
            zoom={data.heroCamera.zoom}
          />
          <span className="hand closeup-dossier__insetLabel">site</span>
        </div>
        <div className="closeup-dossier__links">
          <a href={hero.links?.wikipedia} target="_blank" rel="noreferrer">
            wikipedia ↗
          </a>
          <a href={hero.links?.googleMaps} target="_blank" rel="noreferrer">
            google maps ↗
          </a>
        </div>
      </div>
    </section>
  )
}
