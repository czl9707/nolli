// apps/poster/src/components/shared/caption-options.tsx
import { Tabs, TabsList, TabsTrigger, Input } from "@nolli/ui"
import { useCaptionStore } from "@/stores/caption"
import { useSelectionStore } from "@/stores/selection"
import { useRouteStore } from "@/stores/route"
import { EDGES, CORNERS } from "@/lib/caption-types"
import styles from "./caption-options.module.css"

const EDGE_LABELS: Record<(typeof EDGES)[number], string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
}

const MIN_SIZE = 8
const MAX_SIZE = 120

/** Freeform hint shown in overview, where there is no selected building. */
const OVERVIEW_PLACEHOLDER = {
  primary: "Add primary text",
  secondary: "Add secondary text",
}

/**
 * Caption knobs, shared by both routes: position (which edge + corner the
 * caption docks to — also the source of truth the spotlight image is derived
 * from, by docking opposite), the two font sizes, and the two caption-text
 * overrides (primary + secondary lines).
 *
 * Caption direction is not a knob — it's derived from the edge (left/right →
 * vertical, top/bottom → horizontal) in <Caption>.
 *
 * In spotlight the text inputs preview against the selected building's
 * name/architect (resolved on demand by slug via the selection store, so it
 * still resolves when the viewport or filter excludes it). In overview there
 * is no building, so the generic `OVERVIEW_PLACEHOLDER` hint is shown.
 */
export function CaptionOptions() {
  const route = useRouteStore((s) => s.route)
  const spotlight = route === "spotlight"
  const captionEdge = useCaptionStore((s) => s.captionEdge)
  const captionCorner = useCaptionStore((s) => s.captionCorner)
  const primarySize = useCaptionStore((s) => s.primarySize)
  const secondarySize = useCaptionStore((s) => s.secondarySize)
  const customPrimary = useCaptionStore((s) => s.customPrimary)
  const customSecondary = useCaptionStore((s) => s.customSecondary)
  const setCaptionEdge = useCaptionStore((s) => s.setCaptionEdge)
  const setCaptionCorner = useCaptionStore((s) => s.setCaptionCorner)
  const setPrimarySize = useCaptionStore((s) => s.setPrimarySize)
  const setSecondarySize = useCaptionStore((s) => s.setSecondarySize)
  const setCustomPrimary = useCaptionStore((s) => s.setCustomPrimary)
  const setCustomSecondary = useCaptionStore((s) => s.setCustomSecondary)
  const selected = useSelectionStore((s) => s.selected)
  const summaries = useSelectionStore((s) => s.summaries)
  const slug = spotlight ? Array.from(selected)[0] : undefined
  const building = slug ? summaries[slug] ?? null : null

  const primaryPlaceholder = spotlight ? building?.name : OVERVIEW_PLACEHOLDER.primary
  const secondaryPlaceholder = spotlight ? building?.architect : OVERVIEW_PLACEHOLDER.secondary

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
