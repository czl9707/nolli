// apps/poster/src/components/spotlight-controls.tsx
import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, Input } from "@nolli/ui"
import { useSpotlightStore } from "@/stores/spotlight"
import { useSelectionStore } from "@/stores/selection"
import { EDGES, CORNERS } from "@/lib/spotlight-types"
import type { ArchSummary } from "@nolli/data"
import styles from "./spotlight-controls.module.css"

const EDGE_LABELS: Record<(typeof EDGES)[number], string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
}

const MIN_SIZE = 8
const MAX_SIZE = 120

/**
 * Caption knobs, shared by both routes: position (which edge + corner the
 * caption docks to — also the source of truth the spotlight image is derived
 * from, by docking opposite), the two font sizes, and the two caption-text
 * overrides (primary + secondary lines).
 *
 * Caption direction is not a knob — it's derived from the edge (left/right →
 * vertical, top/bottom → horizontal) in <SpotlightCaption>.
 *
 * In spotlight (`buildings` passed) the text inputs preview against the
 * selected building's name/architect. In overview (`placeholder` passed
 * instead) there is no building, so a generic hint is shown.
 */
export function SpotlightCaptionOptions({
  buildings,
  placeholder,
}: {
  buildings?: ArchSummary[]
  placeholder?: { primary?: string; secondary?: string }
}) {
  const captionEdge = useSpotlightStore((s) => s.captionEdge)
  const captionCorner = useSpotlightStore((s) => s.captionCorner)
  const primarySize = useSpotlightStore((s) => s.primarySize)
  const secondarySize = useSpotlightStore((s) => s.secondarySize)
  const customPrimary = useSpotlightStore((s) => s.customPrimary)
  const customSecondary = useSpotlightStore((s) => s.customSecondary)
  const setCaptionEdge = useSpotlightStore((s) => s.setCaptionEdge)
  const setCaptionCorner = useSpotlightStore((s) => s.setCaptionCorner)
  const setPrimarySize = useSpotlightStore((s) => s.setPrimarySize)
  const setSecondarySize = useSpotlightStore((s) => s.setSecondarySize)
  const setCustomPrimary = useSpotlightStore((s) => s.setCustomPrimary)
  const setCustomSecondary = useSpotlightStore((s) => s.setCustomSecondary)
  const selected = useSelectionStore((s) => s.selected)

  const building = useMemo(() => {
    if (!buildings) return null
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  const primaryPlaceholder = placeholder?.primary ?? building?.name
  const secondaryPlaceholder = placeholder?.secondary ?? building?.architect

  return (
    <div className={styles.stack}>
      <Field label="Caption edge">
        <Tabs value={captionEdge} onValueChange={(v) => setCaptionEdge(v as (typeof EDGES)[number])}>
          <TabsList>
            {EDGES.map((e) => (
              <TabsTrigger key={e} value={e}>{EDGE_LABELS[e]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Field>

      <Field label="Caption corner">
        <Tabs value={captionCorner} onValueChange={(v) => setCaptionCorner(v as (typeof CORNERS)[number])}>
          <TabsList>
            <TabsTrigger value={CORNERS[0]}>Start</TabsTrigger>
            <TabsTrigger value={CORNERS[1]}>End</TabsTrigger>
          </TabsList>
        </Tabs>
      </Field>

      <Field label="Caption text">
        <div className={styles.col}>
          <LabeledText
            label="Primary"
            value={customPrimary}
            placeholder={primaryPlaceholder}
            onChange={setCustomPrimary}
          />
          <LabeledText
            label="Secondary"
            value={customSecondary}
            placeholder={secondaryPlaceholder}
            onChange={setCustomSecondary}
          />
        </div>
      </Field>

      <Field label="Font size">
        <div className={styles.twoCol}>
          <LabeledNumber label="Primary" value={primarySize} onChange={setPrimarySize} />
          <LabeledNumber label="Secondary" value={secondarySize} onChange={setSecondarySize} />
        </div>
      </Field>
    </div>
  )
}

function LabeledText({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <label className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      <Input
        type="number"
        min={MIN_SIZE}
        max={MAX_SIZE}
        value={value}
        onChange={(e) => onChange(clampSize(e.target.value))}
      />
    </label>
  )
}

function clampSize(raw: string): number {
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n)) return MIN_SIZE
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n))
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </div>
  )
}
