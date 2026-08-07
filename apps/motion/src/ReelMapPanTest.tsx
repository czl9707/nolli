import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import { useThemeStore } from "@nolli/ui";
import { useState } from "react";
import { useMapCamera } from "./lib/use-map-camera";
import type { ArchSummary } from "@nolli/data";

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });

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
];

// Pan from Berlin (frame 0) to New York (frame 3) over 4 frames.
export const ReelMapPanTest: React.FC = () => {
  const frame = useCurrentFrame();
  const [map, setMap] = useState<MapRef | null>(null);
  const t = Math.min(frame / 3, 1);
  const center: [number, number] = [
    13.4 + (-74.0 - 13.4) * t,
    52.5 + (40.7 - 52.5) * t,
  ];
  useMapCamera(map, { center, zoom: 4 }, frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#171717" }}>
      <ArchMap
        ref={setMap}
        architectures={BUILDINGS}
        selectedSlug="a"
        ready
        capture
      />
    </AbsoluteFill>
  );
};
