// PROTOTYPE variant A — Ledger, pane-split model. Screen → HSplit/VSplit of
// Panes; each pane declares its own size (span = 12-col track, size = CSS
// length, or fill). Sibling borders are the split lines. Hero: full-screen
// map + cursor plate under the panes. Index: the map is one pane.
import { useEffect, useRef, useState } from "react"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { H1 } from "@nolli/ui"
import { HERO_CAMERA } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import { usePrototypeData, CITIES } from "../data"
import { MapSurface } from "../map-surface"
import { CursorReveal, usePlatePicks } from "../reveal"
import {
  HeroHeadline,
  NearestCaption,
  PickList,
  PrototypeHeader,
  Statement,
} from "../chrome"
import { Bleed, HSplit, Pane, Screen, VSplit } from "../grid"
import { useHeroRig, useCityFly } from "./shared"
import styles from "./a.module.css"

export const VariantA = {
  key: "A",
  name: "Ledger",
  Component: VariantAComponent,
}

/** Far outliers excluded from the hero fit (still rendered, just not fitted
 * — they'd pull the camera out until the rest clutters). */
const HERO_EXCLUDE = new Set(["fondation-louis-vuitton", "philharmonie-de-paris"])

function VariantAComponent() {
  const { status, error, data, picksByCity } = usePrototypeData()

  if (status === "error") return <LoadNote msg={error?.message ?? "failed to load"} />
  if (status !== "ready" || !data) return <LoadNote msg="loading the map…" />

  return (
    <>
      <PrototypeHeader />
      <HeroScene picks={data.indexPhotos} />
      <IndexScene picksByCity={picksByCity} />
    </>
  )
}

function LoadNote({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "40vh 2rem", textAlign: "center", opacity: 0.6 }}>
      <p>{msg}</p>
    </div>
  )
}

function HeroScene({ picks }: { picks: ArchSummary[] }) {
  const { surfaceRef, map, setMap, sx, sy } = useHeroRig()
  const { nearest, active } = usePlatePicks(sx, sy, picks, map)
  // the reveal roams only the top-left pane
  const boundsRef = useRef<HTMLDivElement | null>(null)

  // fit the picks to the PANE and center them there, so the photo cards land
  // inside the reveal area: outliers excluded, camera fitted to pane px with
  // moderate padding, then shifted so the fitted midpoint projects to the
  // pane center instead of the viewport center
  useEffect(() => {
    const pane = boundsRef.current
    if (!map || !pane || !picks.length) return
    const b = pane.getBoundingClientRect()
    const kept = picks.filter((p) => !HERO_EXCLUDE.has(p.slug))
    const fit = fitCamera(
      kept.map((p) => p.coordinates),
      { width: b.width, height: b.height },
      { x: 100, top: 100, bottom: 240 },
    )
    map.jumpTo({ center: fit.center, zoom: fit.zoom })
    const c1 = map.unproject([
      window.innerWidth - (b.left + b.width / 2),
      window.innerHeight - (b.top + b.height / 2),
    ])
    map.jumpTo({ center: [c1.lng, c1.lat], zoom: fit.zoom })
  }, [map, picks])

  return (
    <Screen className={styles.heroScreen}>
      <Bleed>
        <MapSurface
          className={styles.fullMap}
          camera={HERO_CAMERA}
          picks={picks}
          onMap={setMap}
          surfaceRef={surfaceRef}
        >
          <CursorReveal
            surfaceRef={surfaceRef}
            boundsRef={boundsRef}
            map={map}
            sx={sx}
            sy={sy}
            tagTr="Paris"
          />
        </MapSurface>
      </Bleed>
      <div className={styles.splits}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <Pane>
            <VSplit>
              <Pane size="calc(100vw - var(--col-width) - max(var(--pad), calc(var(--col-width) * 2)))" >
                <HSplit>
                  <Pane size="75%">
                    <div ref={boundsRef} className={styles.revealBounds} />
                  </Pane>
                  <Pane className={styles.headlineBody}>
                    <HeroHeadline />
                  </Pane>
                </HSplit>
              </Pane>
              <Pane size="calc(var(--col-width) + max(var(--pad), calc(var(--col-width) * 2)))" >
                <HSplit>
                  <Pane size="75%" className={styles.pickBody}>
                    <PickList picks={picks} active={active} />
                  </Pane>
                  <Pane className={styles.captionBody}>
                    <NearestCaption nearest={nearest} />
                  </Pane>
                </HSplit>
              </Pane>
            </VSplit>
          </Pane>
        </HSplit>
      </div>
    </Screen>
  )
}

function IndexScene({ picksByCity }: { picksByCity: Record<string, ArchSummary[]> }) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapRef | null>(null)
  const { selected, onSelect } = useCityFly(picksByCity, surfaceRef, map)
  const picks = picksByCity[selected] ?? []
  const loaded = Object.keys(picksByCity)

  return (
    <Screen className={styles.indexScreen}>
      <HSplit>
        <Pane size="var(--size-header-height)" />
        <Pane>
          <VSplit>
            <Pane size="var(--pad)" />
            <Pane size="calc(var(--col-width) * 4)">
              <HSplit>
                <Pane size="55%" className={styles.cityBody}>
                  <H1 asChild>
                    <h2 className={styles.city}>{selected}</h2>
                  </H1>
                  <Statement />
                </Pane>
                <Pane>
                  <VSplit>
                    <Pane size="calc(var(--col-width) * 2)">
                      <CityColumn
                        cities={CITIES.slice(0, 3)}
                        selected={selected}
                        loaded={loaded}
                        onSelect={onSelect}
                      />
                    </Pane>
                    <Pane size="calc(var(--col-width) * 2)">
                      <CityColumn
                        cities={CITIES.slice(3)}
                        selected={selected}
                        loaded={loaded}
                        onSelect={onSelect}
                      />
                    </Pane>
                  </VSplit>
                </Pane>
              </HSplit>
            </Pane>
            <Pane size="calc(var(--col-width) * 8)">
              <MapSurface
                className={styles.mapFill}
                camera={HERO_CAMERA}
                picks={picks}
                fit
                onMap={setMap}
                surfaceRef={surfaceRef}
              />
            </Pane>
            <Pane size="var(--pad)" />
          </VSplit>
        </Pane>
      </HSplit>
    </Screen>
  )
}

/** One column of the 2x3 city grid — three panes, each pane IS the button. */
function CityColumn({
  cities,
  selected,
  loaded,
  onSelect,
}: {
  cities: readonly string[]
  selected: string
  loaded: string[]
  onSelect: (name: string) => void
}) {
  return (
    <HSplit>
      {cities.map((name) => {
        const ready = loaded.includes(name)
        const cls = [
          styles.cityCell,
          name === selected ? styles.cityCellActive : "",
          ready ? "" : styles.cityCellPending,
        ]
          .filter(Boolean)
          .join(" ")
        return (
          <Pane key={name}>
            <div
              className={cls}
              onClick={() => ready && onSelect(name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (ready) onSelect(name)
                }
              }}
            >
              {name}
            </div>
          </Pane>
        )
      })}
    </HSplit>
  )
}
