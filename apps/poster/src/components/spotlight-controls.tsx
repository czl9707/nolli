// apps/poster/src/components/spotlight-controls.tsx
import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, Input } from "@nolli/ui"
import { useSpotlightStore } from "@/stores/spotlight"
import { useSelectionStore } from "@/stores/selection"
import { EDGES, CORNERS, DIRS } from "@/lib/spotlight-types"
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
 * Sidebar panel for the spotlight layout knobs, built on the shared <Tabs>
 * (edge / corner / direction) and the shared <Input> for the two font sizes
 * and the two caption-text overrides, each pair laid out as two equal columns.
 */
export function SpotlightControls({ buildings }: { buildings: ArchSummary[] }) {
  const imageEdge = useSpotlightStore((s) => s.imageEdge)
  const captionCorner = useSpotlightStore((s) => s.captionCorner)
  const captionDirection = useSpotlightStore((s) => s.captionDirection)
  const nameSize = useSpotlightStore((s) => s.nameSize)
  const architectSize = useSpotlightStore((s) => s.architectSize)
  const customName = useSpotlightStore((s) => s.customName)
  const customArchitect = useSpotlightStore((s) => s.customArchitect)
  const setImageEdge = useSpotlightStore((s) => s.setImageEdge)
  const setCaptionCorner = useSpotlightStore((s) => s.setCaptionCorner)
  const setCaptionDirection = useSpotlightStore((s) => s.setCaptionDirection)
  const setNameSize = useSpotlightStore((s) => s.setNameSize)
  const setArchitectSize = useSpotlightStore((s) => s.setArchitectSize)
  const setCustomName = useSpotlightStore((s) => s.setCustomName)
  const setCustomArchitect = useSpotlightStore((s) => s.setCustomArchitect)
  const selected = useSelectionStore((s) => s.selected)

  const building = useMemo(() => {
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  return (
    <div className={styles.stack}>
      <Field label="Image edge">
        <Tabs value={imageEdge} onValueChange={(v) => setImageEdge(v as (typeof EDGES)[number])}>
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

      <Field label="Caption direction">
        <Tabs value={captionDirection} onValueChange={(v) => setCaptionDirection(v as (typeof DIRS)[number])}>
          <TabsList>
            <TabsTrigger value="horizontal">Horizontal</TabsTrigger>
            <TabsTrigger value="rotated">Vertical</TabsTrigger>
          </TabsList>
        </Tabs>
      </Field>

      <Field label="Caption text">
        <div className={styles.col}>
          <LabeledText
            label="Name"
            value={customName}
            placeholder={building?.name}
            onChange={setCustomName}
          />
          <LabeledText
            label="Architect"
            value={customArchitect}
            placeholder={building?.architect}
            onChange={setCustomArchitect}
          />
        </div>
      </Field>

      <Field label="Font size">
        <div className={styles.twoCol}>
          <LabeledNumber label="Name" value={nameSize} onChange={setNameSize} />
          <LabeledNumber label="Architect" value={architectSize} onChange={setArchitectSize} />
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
