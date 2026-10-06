// Placeholder plate — the map-as-background base between the hero and the
// footer. The map's shape anchor is fixed fullscreen, so the spine's glue
// never moves the map here; the null camera keeps the hero fit. The plate
// parks sticky for the hold's first viewport, then the footer rides the
// tail band — inside the spine wrapper, so the sticky map frame stays
// behind the footer for its full height.
import { Note } from "@nolli/ui"
import type { LandingData } from "@/lib/landing-data"
import type { HoldScene } from "@/spine/timeline"
import { Footer } from "./footer"
import { Pane } from "./page-layout"
import styles from "./placeholder.module.css"

/** Hold height in scene vh: one viewport of plate, then the footer band. */
const SCENE_VH = 220

export const placeholderHold = (data: LandingData): HoldScene => ({
  id: "plate",
  shape: "[data-spine-shape='plate']",
  heightVh: SCENE_VH,
  camera: () => null,
  rulesOverMap: true,
  Component: () => <Plate data={data} />,
})

function Plate({ data }: { data: LandingData }) {
  return (
    <>
      <div aria-hidden data-spine-shape="plate" className={styles.mapAnchor} />
      <div className={styles.plate}>
        <Pane filled className={styles.panel}>
          <Note className={styles.panelLabel}>Coming Soon</Note>
          <h2 className={styles.panelHead}>More plates are being drawn.</h2>
        </Pane>
      </div>
      <div className={styles.footerSlot}>
        <Footer data={data} />
      </div>
    </>
  )
}
