// PROTOTYPE variant C — Poster. Full-bleed map in both scenes, no rules:
// type overlays the grid. Giant headline low-left with the pick list as a
// right rail; the index puts the selected city huge top-left, the statement
// top-right, the city list low-left.
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
import { Bleed, Cell, Scene } from "../grid"
import { useHeroRig, useCityFly } from "./shared"
import styles from "./c.module.css"

export const VariantC = {
  key: "C",
  name: "Poster",
  Component: VariantCComponent,
}

function VariantCComponent() {
  const { status, error, data, picksByCity } = usePrototypeData()

  if (status === "error") return <LoadNote msg={error?.message ?? "failed to load"} />
  if (status !== "ready" || !data) return <LoadNote msg="loading the map…" />

  return (
    <>
      <PrototypeHeader tone="onMap" />
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
    <Scene className={styles.heroScene}>
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
      <Cell className={styles.headlineCell} col={1} colSpan={4} row={5} rowSpan={2}>
        <HeroHeadline className={styles.posterHeadline} />
      </Cell>
      <Cell className={styles.pickCell} col={6} row={2} rowSpan={4}>
        <PickList picks={picks} active={active} />
      </Cell>
      <Cell className={styles.captionCell} col={5} colSpan={2} row={6} rowSpan={1}>
        <NearestCaption nearest={nearest} />
      </Cell>
    </Scene>
  )
}

function IndexScene({ picksByCity }: { picksByCity: Record<string, ArchSummary[]> }) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapRef | null>(null)
  const { selected, onSelect } = useCityFly(picksByCity, surfaceRef, map)
  const picks = picksByCity[selected] ?? []
  const loaded = Object.keys(picksByCity)

  return (
    <Scene>
      <Bleed>
        <MapSurface
          className={styles.fullMap}
          camera={HERO_CAMERA}
          picks={picks}
          fit
          onMap={setMap}
          surfaceRef={surfaceRef}
        />
      </Bleed>
      <Cell className={styles.cityCell} col={1} colSpan={3} row={1} rowSpan={2}>
        <H1 asChild>
          <h2 className={styles.city}>{selected}</h2>
        </H1>
      </Cell>
      <Cell className={styles.statementCell} col={5} colSpan={2} row={1} rowSpan={2}>
        <Statement />
      </Cell>
      <Cell className={styles.listCell} col={1} colSpan={2} row={4} rowSpan={3}>
        <CityList cities={CITIES} selected={selected} loaded={loaded} onSelect={onSelect} />
      </Cell>
    </Scene>
  )
}
