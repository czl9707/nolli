import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@nolli/ui"
import { useRouteStore } from "@/stores/route"
import type { Side } from "@/lib/url-state"

const SIDES: { id: Side; Icon: typeof ArrowDownRight; label: string }[] = [
  // Arrow points from the corner toward the center, matching the photo's
  // position in that corner.
  { id: "top-left", Icon: ArrowDownRight, label: "Top left" },
  { id: "top-right", Icon: ArrowDownLeft, label: "Top right" },
  { id: "bottom-left", Icon: ArrowUpRight, label: "Bottom left" },
  { id: "bottom-right", Icon: ArrowUpLeft, label: "Bottom right" },
]

/**
 * Photo-corner selector for spotlight, built on the shared <Tabs>. Picks which
 * corner the hero photo floats in; the map recomposes so the marker stays
 * centered in the opposite quadrant. Icons stay compact across the four
 * equal-width tabs. The surrounding section/label are provided by
 * <PosterShell>'s SidebarSection so every sidebar block stays uniform.
 */
export function SideFlipControl() {
  const side = useRouteStore((s) => s.side)
  const setSide = useRouteStore((s) => s.setSide)

  return (
    <Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
      <TabsList>
        {SIDES.map(({ id, Icon, label }) => (
          <TabsTrigger key={id} value={id} aria-label={label}>
            <Icon size={16} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
