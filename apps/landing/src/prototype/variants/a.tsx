// PROTOTYPE variant A — Ledger, pane-split model. Screen → HSplit/VSplit of
// Panes; each pane declares its own size (span = 12-col track, size = CSS
// length, or fill). Sibling borders are the split lines. Hero: full-screen
// map + cursor plate under the panes. Index: the map is one pane.
import { useRef, useState } from "react"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { H1 } from "@nolli/ui"
import { HERO_CAMERA } from "@/lib/constants"
import { usePrototypeData, CITIES } from "../data"
import { MapSurface } from "../map-surface"
import { CursorReveal, usePlatePicks } from "../reveal"
import {
  CityList,
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
          <CursorReveal surfaceRef={surfaceRef} map={map} sx={sx} sy={sy} tagTr="Paris" />
        </MapSurface>
      </Bleed>
      <div className={styles.splits}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <Pane>
            <VSplit>
              <Pane size="calc(100vw - var(--col-width) - max(var(--pad), calc(var(--col-width) * 2)))" >
                <HSplit>
                  <Pane size="75%" />
                  <Pane 
                   className={styles.headlineBody}
                  >
                    {/* <VSplit>
                      <Pane size="calc(var(--pad) + var(--col-width) * 6)" className={styles.headlineBody}> */}
                        <HeroHeadline />
                      {/* </Pane>
                      <Pane />
                    </VSplit> */}
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
    <Screen>
      <HSplit>
        <Pane size="var(--size-header-height)" />
        <Pane>
          <VSplit>
            <Pane size="var(--pad)" />
            <Pane size="calc(var(--col-width) * 4)">
              <HSplit>
                <Pane size="60%" className={styles.cityBody}>
                  <H1 asChild>
                    <h2 className={styles.city}>{selected}</h2>
                  </H1>
                  <Statement />
                </Pane>
                <Pane size="40%" className={styles.listBody}>
                  <CityList cities={CITIES} selected={selected} loaded={loaded} onSelect={onSelect} />
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
