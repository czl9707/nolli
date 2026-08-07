import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import { useThemeStore } from "@nolli/ui";
import { useState } from "react";
import { THEME } from "./theme";
import { useReelConfig } from "./lib/use-reel-config";
import { useAllBuildings } from "./lib/use-all-buildings";
import { useMapCamera } from "./lib/use-map-camera";
import { getTimelineState, BEAT } from "./lib/timeline";
import { flyViewport, fitViewport, type MapViewport } from "./lib/viewport";
import { Masthead } from "./components/Masthead";
import { Hero } from "./components/Hero";
import { Caption } from "./components/Caption";
import { ContactSheet } from "./components/ContactSheet";

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });

const MAP_MAX_ZOOM = 6;
const MAX_BUILDING_ZOOM = 14;

export const ReelComposition: React.FC<{ slug: string }> = ({ slug }) => {
  const frame = useCurrentFrame();
  const cfg = useReelConfig(slug);
  const allBuildings = useAllBuildings();
  const [map, setMap] = useState<MapRef | null>(null);

  const buildings = cfg?.buildings ?? [];
  const hookIndex = buildings.length
    ? Math.max(0, buildings.findIndex((b) => b.slug === cfg!.hookSlug))
    : 0;
  const st = buildings.length
    ? getTimelineState(frame, buildings.length, hookIndex)
    : null;
  const current = st ? buildings[st.currentIndex] : null;

  let vp: MapViewport = { center: [0, 0], zoom: 1 };
  if (st && current) {
    if (st.beat === BEAT.WALK)
      vp = flyViewport(buildings, st.currentIndex, st.intra, MAX_BUILDING_ZOOM);
    else if (st.beat === BEAT.WHOLE) vp = fitViewport(buildings, MAP_MAX_ZOOM);
    else
      vp = {
        center: [current.coordinates.lng, current.coordinates.lat],
        zoom: MAX_BUILDING_ZOOM,
      };
  }
  useMapCamera(map, vp, frame);

  if (!cfg || !allBuildings || !st || !current) return null;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg, padding: 24 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: 12,
        }}
      >
        <Masthead episode={cfg.episode} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            {st.beat < BEAT.CTA ? (
              <>
                <Hero slug={cfg.slug} buildingSlug={current.slug} />
                <Caption
                  name={st.beat === BEAT.NAME ? cfg.architect : current.name}
                  year={current.year}
                  city={current.city}
                  countryCode={current.countryCode}
                />
                {st.beat === BEAT.WHOLE ? (
                  <div
                    style={{
                      color: THEME.fgSecondary,
                      fontSize: 16,
                      padding: "0 4px 8px",
                    }}
                  >
                    {cfg.stats.line}
                  </div>
                ) : null}
                <ContactSheet
                  slug={cfg.slug}
                  buildings={buildings}
                  currentIndex={st.currentIndex}
                />
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.fg,
                  fontSize: 40,
                  textAlign: "center",
                }}
              >
                Explore {cfg.architect}&apos;s work in Nolli
              </div>
            )}
          </div>
          <div
            style={{
              position: "relative",
              minHeight: 0,
              overflow: "hidden",
              borderRadius: 12,
            }}
          >
            <ArchMap
              ref={setMap}
              architectures={allBuildings}
              selectedSlug={current.slug}
              ready
              capture
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
