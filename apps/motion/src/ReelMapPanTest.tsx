import { AbsoluteFill, useCurrentFrame } from "remotion"
import { ReelMap } from "./components/ReelMap"
import type { ArchSummary } from "@nolli/data"

const BUILDINGS: ArchSummary[] = [
  {
    id: 1,
    slug: "a",
    name: "A",
    architect: "X",
    year: 1928,
    coordinates: { lng: 13.4, lat: 52.5 },
    cover: { image: "", width: 0, height: 0 },
  },
  {
    id: 2,
    slug: "b",
    name: "B",
    architect: "X",
    year: 1958,
    coordinates: { lng: -74.0, lat: 40.7 },
    cover: { image: "", width: 0, height: 0 },
  },
]

// Pan from Berlin (frame 0) to New York (frame 3) over 4 frames.
export const ReelMapPanTest: React.FC = () => {
  const frame = useCurrentFrame()
  const t = Math.min(frame / 3, 1)
  const center: [number, number] = [
    13.4 + (-74.0 - 13.4) * t,
    52.5 + (40.7 - 52.5) * t,
  ]
  return (
    <AbsoluteFill style={{ backgroundColor: "#171717" }}>
      <ReelMap
        architectures={BUILDINGS}
        selectedSlug="a"
        viewport={{ center, zoom: 4 }}
      />
    </AbsoluteFill>
  )
}
