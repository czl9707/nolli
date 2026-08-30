import { motion, useTransform } from "framer-motion"
import { Body1, Button, H1, Note } from "@nolli/ui"
import { SOUTH_CAMERA, WORLD_CAMERA, APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"
import type { SceneFactory } from "@/lib/scene"
import { useSceneCamera, useSceneScroll } from "@/stage/hooks"
import styles from "./cta.module.css"

const FULL = { x: 0, y: 0, w: 1, h: 1 }

const CTA_KEYFRAMES = [
  { at: 0, layer: FULL, camera: WORLD_CAMERA },
  { at: 96, layer: FULL, camera: SOUTH_CAMERA },
  { at: 160, layer: FULL },
]

/** CTA: world view dwells, copy pins over a settling dark grade; at dwell
 * end the camera flies far south — the static footer rises over it. */
export const ctaScene: SceneFactory = ({ data }) => ({
  id: "cta",
  heightVh: 160,
  keyframes: CTA_KEYFRAMES,
  Component: () => <CtaScene data={data} />,
})

function CtaScene({ data }: { data: LandingData }) {
  useSceneCamera(CTA_KEYFRAMES)
  const local = useSceneScroll()
  // fade in across the approach (-40 → 0), 1 through the dwell (96), out
  // across the whole outgoing transition (96 → 160) — the old last-but-one
  // rule, since the flow-mounted footer takes over at the boundary
  const opacity = useTransform(local, (v) =>
    v < -40 ? 0 : v < 0 ? (v + 40) / 40 : v <= 96 ? 1 : Math.max(0, 1 - (v - 96) / 64),
  )
  return (
    <motion.section className={styles.bookend} style={{ opacity }}>
      <div className={styles.grade} />
      <div className={styles.sheet}>
        <div className={styles.copy}>
          <Note asChild>
            <p className={styles.overline}>
              {data.stats.architectures} works · {data.stats.architects} architects
            </p>
          </Note>
          <H1 asChild>
            <h2>Open the Map.</h2>
          </H1>
          <Body1 asChild>
            <p className={styles.sub}>free</p>
          </Body1>
          <Button variant="outline" size="lg" asChild className={styles.btn}>
            <a href={APP_URL}>Open Nolli →</a>
          </Button>
        </div>
      </div>
    </motion.section>
  )
}
