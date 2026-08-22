import { useEffect, useState } from "react"
import { useMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import type { LandingData } from "@/lib/landing-data"
import { MapStage } from "@/components/map-stage"

const CLUSTER_CAMERA = { center: [2.3522, 48.8556] as [number, number], zoom: 12.35 }

/** Framed card is ~half the width of the fullscreen stage — zoom out to fit the cluster. */
const FRAMED_CAMERA = { center: [2.3522, 48.8606] as [number, number], zoom: 10.9 }

/** Projects cluster photos onto the map canvas; reprojects on resize. */
function ProjectedPhotos({
  cluster,
  render,
}: {
  cluster: ArchSummary[]
  render: (points: { x: number; y: number; arch: ArchSummary }[]) => React.ReactNode
}) {
  const { map, isLoaded } = useMap()
  const [points, setPoints] = useState<{ x: number; y: number; arch: ArchSummary }[] | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return
    const project = () =>
      setPoints(
        cluster.map((arch) => {
          const p = map.project([arch.coordinates.lng, arch.coordinates.lat])
          return { x: p.x, y: p.y, arch }
        }),
      )
    project()
    map.on("resize", project)
    return () => {
      map.off("resize", project)
    }
  }, [map, isLoaded, cluster])

  if (!points) return null
  return <>{render(points)}</>
}

function PhotoCard({
  arch,
  x,
  y,
  width,
  rotate,
  lift,
}: {
  arch: ArchSummary
  x: number
  y: number
  width: number
  rotate: number
  lift: number
}) {
  return (
    <figure
      className="card pin index-scatter__photo"
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - width * 0.7,
        width,
        rotate: `${rotate}deg`,
        translate: `0 ${lift}px`,
        zIndex: 10 + lift,
      }}
    >
      <img src={arch.cover.image} alt={arch.name} loading="lazy" />
      <figcaption className="index-scatter__caption">{arch.name}</figcaption>
    </figure>
  )
}

export function IndexScatter({ data }: { data: LandingData }) {
  return (
    <section className="stage index-scatter">
      <MapStage summaries={[]} {...CLUSTER_CAMERA}>
        <ProjectedPhotos
          cluster={data.cluster}
          render={(points) =>
            points.map((p, i) => (
              <PhotoCard
                key={p.arch.slug}
                arch={p.arch}
                x={p.x}
                y={p.y}
                width={150}
                rotate={[-3, 2, -1, 4, -2, 3, -4, 1, -2, 2][i % 10]}
                lift={[0, 48, -36, 84, 12, -72, 60, -12, 108, -48][i % 10]}
              />
            ))
          }
        />
      </MapStage>
      <div className="index-scatter__panel">
        <p className="hand index-scatter__overline">The Index</p>
        <h2 className="index-scatter__statement">
          Google Maps has all the pins.
          <br />
          ArchDaily has all the information.
          <br />
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </section>
  )
}

export function IndexSplit({ data }: { data: LandingData }) {
  return (
    <section className="stage index-split">
      <div className="index-split__list">
        <p className="hand index-split__overline">The Index — Paris</p>
        <h2 className="index-split__statement">
          Google Maps has all the pins. ArchDaily has all the information.{" "}
          <strong>Nolli bridges the gap.</strong>
        </h2>
        <ul className="index-split__names">
          {data.cluster.map((arch) => (
            <li key={arch.slug}>
              <span>{arch.name}</span>
              <span className="index-split__year">{arch.year}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="index-split__map">
        <MapStage summaries={data.cluster} {...CLUSTER_CAMERA} />
      </div>
    </section>
  )
}

export function IndexDeck({ data }: { data: LandingData }) {
  const deck = data.cluster.slice(0, 6)
  return (
    <section className="stage index-deck">
      <MapStage summaries={[]} {...CLUSTER_CAMERA} />
      <div className="index-deck__cards">
        {deck.map((arch, i) => (
          <figure key={arch.slug} className="card index-deck__card" style={{ "--i": i } as React.CSSProperties}>
            <img src={arch.cover.image} alt={arch.name} loading="lazy" />
            <figcaption>
              {arch.name} <span>· {arch.year}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="index-deck__copy">
        <p className="hand index-deck__overline">The Index</p>
        <h2 className="index-deck__statement">
          Google Maps has all the pins. ArchDaily has all the information.{" "}
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </section>
  )
}

export function IndexFramed({ data }: { data: LandingData }) {
  return (
    <section className="stage index-frame">
      <div className="index-frame__grade" />
      <div className="index-frame__wrap">
        <div className="index-frame__card">
          <div className="index-frame__scrim" />
          <MapStage summaries={[]} {...FRAMED_CAMERA}>
            <ProjectedPhotos
              cluster={data.cluster.slice(0, 7)}
              render={(points) =>
                points.map((p, i) => (
                  <PhotoCard
                    key={p.arch.slug}
                    arch={p.arch}
                    x={p.x}
                    y={p.y}
                    width={118}
                    rotate={[-3, 2, -1, 4, -2, 3, -4][i % 7]}
                    lift={[-10, -34, 64, -12, 92, -52, 8][i % 7]}
                  />
                ))
              }
            />
          </MapStage>
          <div className="index-frame__copy">
            <p className="hand index-frame__overline">The Index</p>
            <h2 className="index-frame__statement">
              Google Maps has all the pins.
              <br />
              ArchDaily has all the information.
              <br />
              <strong>Nolli bridges the gap.</strong>
            </h2>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Poke: map exits fullscreen into "app mode" — light page, dark map card, text above the map. */
export function IndexLight({ data }: { data: LandingData }) {
  return (
    <section className="stage index-light">
      <div className="index-light__wrap">
        <div className="index-light__col">
          <div className="index-light__copy">
            <p className="hand index-light__overline">The Index</p>
            <h2 className="index-light__statement">
              Google Maps has all the pins.
              <br />
              ArchDaily has all the information.
              <br />
              <strong>Nolli bridges the gap.</strong>
            </h2>
          </div>
          <div className="index-light__card">
            <MapStage summaries={[]} {...FRAMED_CAMERA}>
              <ProjectedPhotos
                cluster={data.cluster.slice(0, 7)}
                render={(points) =>
                  points.map((p, i) => (
                    <PhotoCard
                      key={p.arch.slug}
                      arch={p.arch}
                      x={p.x}
                      y={p.y}
                      width={118}
                      rotate={[-3, 2, -1, 4, -2, 3, -4][i % 7]}
                      lift={[-10, -34, 64, -12, 92, -52, 8][i % 7]}
                    />
                  ))
                }
              />
            </MapStage>
          </div>
        </div>
      </div>
    </section>
  )
}
