// apps/poster/src/components/shared/caption.tsx
import { useMemo } from "react"
import { useSelectionStore } from "@/stores/selection"
import { useSpotlightStore } from "@/stores/spotlight"
import { useFrameSize } from "@/hooks/use-frame-size"
import type { ArchSummary } from "@nolli/data"
import styles from "./caption.module.css"

/** Wrap margin around the caption, matching the CSS --spacing-component. */
const MARGIN = 32

/**
 * Typographic caption overlaid directly on the map: Inter (not the playful
 * Body scale) with a text-shadow for legibility. Docks at its own
 * `captionEdge` / `captionCorner` in BOTH routes — this is the position source
 * of truth; the spotlight image strip docks opposite. Direction is derived from
 * the caption edge — left/right → vertical, top/bottom → horizontal — so it is
 * not a knob.
 *
 * In spotlight (`buildings` passed), `customPrimary` / `customSecondary`, when
 * non-empty, override the selected building's name/architect; otherwise the
 * building's real values are used. In overview (`buildings` omitted) it is
 * pure freeform text — only the custom values are shown. A line whose resolved
 * text is empty is skipped; if both are empty, nothing renders (e.g. overview
 * before the user has typed anything).
 *
 * start/end is along the docked edge (horizontal: start=left/end=right;
 * vertical: start=bottom/end=top). Horizontal uses flexbox; vertical takes the
 * block out of flow (absolute) because writing-mode + flexbox misrenders glyphs
 * and edge alignment. Vertical mode bounds the block's length to the available
 * edge space so a long name wraps instead of overflowing.
 */
export function Caption({ buildings }: { buildings?: ArchSummary[] }) {
  const dockEdge = useSpotlightStore((s) => s.captionEdge)
  const corner = useSpotlightStore((s) => s.captionCorner)
  const primarySize = useSpotlightStore((s) => s.primarySize)
  const secondarySize = useSpotlightStore((s) => s.secondarySize)
  const customPrimary = useSpotlightStore((s) => s.customPrimary)
  const customSecondary = useSpotlightStore((s) => s.customSecondary)
  const selected = useSelectionStore((s) => s.selected)
  const frame = useFrameSize()

  const building = useMemo(() => {
    if (!buildings) return null
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  const vertical = dockEdge === "left" || dockEdge === "right"
  const primary = building ? (customPrimary.trim() || building.name) : customPrimary.trim()
  const secondary = building ? (customSecondary.trim() || building.architect) : customSecondary.trim()

  if (!primary && !secondary) return null

  const boxSize = Math.min(frame.width, (frame.height - frame.headerHeight )) * 0.75 - MARGIN * 2;
  const cls = [styles.wrap]
  cls.push(vertical ? styles.vert : styles.horiz, styles[dockEdge], styles[corner])


  return (
    <div className={cls.join(" ")}>
      <div className={styles.block} style={{ width: boxSize, height: boxSize }}>
        {primary && (
          <span className={styles.primary} style={{ fontSize: primarySize }}>
            {primary}
          </span>
        )}
        {secondary && (
          <span className={styles.secondary} style={{ fontSize: secondarySize }}>
            {secondary}
          </span>
        )}
      </div>
    </div>
  )
}
