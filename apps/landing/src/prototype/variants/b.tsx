// PROTOTYPE variant B — Plate. Map as an object on the paper page: the ink
// plate fills a cell, the cursor reveal is confined to it, and the type
// column (headline, pick list, caption) stands beside it. Index mirrors the
// split.
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
import { Cell, Scene } from "../grid"
import { useHeroRig, useCityFly } from "./shared"
import styles from "./b.module.css"

export const VariantB = {
  key: "B",
  name: "Plate",
  Component: VariantBComponent,
}

function VariantBComponent() {
  const { status, error, data, picksByCity } = usePrototypeData()

  if (status === "error") return <LoadNote msg={error?.message ?? "failed to load"} />
  if (status !== "ready" || !data) return <LoadNote msg="loading the map…" />

  return (
    <>
      <PrototypeHeader tone="onPaper" />
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
    <Scene>
      <Cell className={styles.headlineCell} col={1} colSpan={2} row={1} rowSpan={2}>
        <HeroHeadline />
      </Cell>
      <Cell className={styles.pickCell} col={1} colSpan={2} row={3} rowSpan={4}>
        <PickList picks={picks} active={active} />
      </Cell>
      <Cell className={styles.plateCell} col={3} colSpan={4} row={1} rowSpan={6}>
        <MapSurface
          className={styles.plateMap}
          camera={HERO_CAMERA}
          picks={picks}
          onMap={setMap}
          surfaceRef={surfaceRef}
        >
          <CursorReveal surfaceRef={surfaceRef} map={map} sx={sx} sy={sy} tagTr="Paris" />
          <div className={styles.captionOverlay}>
            <NearestCaption nearest={nearest} />
          </div>
        </MapSurface>
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
      <Cell className={styles.plateCellIndex} col={1} colSpan={4} row={1} rowSpan={6}>
        <MapSurface
          className={styles.plateMap}
          camera={HERO_CAMERA}
          picks={picks}
          fit
          onMap={setMap}
          surfaceRef={surfaceRef}
        />
      </Cell>
      <Cell className={styles.dossier} col={5} colSpan={2} row={1} rowSpan={6}>
        <H1 asChild>
          <h2 className={styles.city}>{selected}</h2>
        </H1>
        <Statement />
        <div className={styles.listWrap}>
          <CityList cities={CITIES} selected={selected} loaded={loaded} onSelect={onSelect} />
        </div>
      </Cell>
    </Scene>
  )
}
