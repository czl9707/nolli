import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { ArchMap } from "@nolli/map";
import { useThemeStore } from "@nolli/ui";
import { useEffect, useState } from "react";
import type { ArchSummary } from "@nolli/data";

// Force the dark theme the map reads from the shared store, once at module load.
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

export const SpikeMap: React.FC = () => {
  const [handle] = useState(() => delayRender("spike-map-load"));
  useEffect(() => {
    // Give the map time to fetch Carto tiles + settle, then release the frame.
    const t = setTimeout(() => continueRender(handle), 5000);
    return () => clearTimeout(t);
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#171717", padding: 40 }}>
      <div style={{ width: "100%", height: "100%" }}>
        <ArchMap
          architectures={BUILDINGS}
          selectedSlug="a"
          ready
          capture
          viewport={{ center: [13.4, 52.5], zoom: 4 }}
        />
      </div>
    </AbsoluteFill>
  );
};
