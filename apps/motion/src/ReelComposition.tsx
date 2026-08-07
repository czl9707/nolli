import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { Body1, H2, useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapFit } from "./lib/use-map-camera";
import { getTimelineState, BEAT } from "./lib/timeline";
import { fitViewport, type MapViewport } from "./lib/viewport";
import { Hero } from "./components/Hero";
import { Caption } from "./components/Caption";
import { ContactSheet } from "./components/ContactSheet";
import { SelectedMarker } from "./components/SelectedMarker";

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
}

const MAP_MAX_ZOOM = 6;
const FALLBACK_VP: MapViewport = { center: [0, 0], zoom: 1 };

export const ReelComposition: React.FC<{ slug: string }> = ({ slug }) => {
  const frame = useCurrentFrame();
  const cfg = useReelConfig(slug);
  const [map, setMap] = useState<MapRef | null>(null);

  const buildings = cfg?.buildings ?? [];
  const hookIndex = buildings.length
    ? Math.max(0, buildings.findIndex((b) => b.slug === cfg!.hookSlug))
    : 0;
  const st = buildings.length
    ? getTimelineState(frame, buildings.length, hookIndex)
    : null;
  const current = st ? buildings[st.currentIndex] : null;

  // The map shows the architect's own buildings only (their footprint). At the
  // fit zoom the figure-ground is legible AND the selected pin stays an
  // individual marker (all-DB markers would cluster and hide the selection).
  const archSummaries = useMemo<ArchSummary[]>(
    () =>
      (cfg?.buildings ?? []).map((b, i) => ({
        id: i,
        slug: b.slug,
        name: b.name,
        architect: cfg!.architect,
        year: b.year,
        coordinates: b.coordinates,
        cover: { image: b.coverImage, width: 0, height: 0 },
      })),
    [cfg],
  );
  // Stable camera: fit to the footprint once, then hold. The figure-ground is
  // only legible at low zoom, so per-frame flying reads as "random locations".
  const fitVp = useMemo<MapViewport>(
    () => (cfg && cfg.buildings.length >= 2 ? fitViewport(cfg.buildings, MAP_MAX_ZOOM) : FALLBACK_VP),
    [cfg],
  );
  useMapFit(map, fitVp);

  if (!cfg || !st || !current) return null;

  return (
    <AbsoluteFill
      data-theme="dark"
      style={{
        backgroundColor: "rgb(var(--color-primary-background))",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
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
                <Body1
                  style={{
                    color: "rgb(var(--color-secondary-foreground))",
                    padding: "0 4px 8px",
                  }}
                >
                  {cfg.stats.line}
                </Body1>
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
                textAlign: "center",
              }}
            >
              <H2 style={{ color: "rgb(var(--color-primary-foreground))" }}>
                Explore {cfg.architect}&apos;s work in Nolli
              </H2>
            </div>
          )}
        </div>
        <div
          style={{
            position: "relative",
            minHeight: 0,
            overflow: "hidden",
            borderRadius: "var(--size-border-radius)",
          }}
        >
          <ArchMap
            ref={setMap}
            architectures={archSummaries}
            selectedSlug={current.slug}
            ready
            capture
          >
            <SelectedMarker
              lng={current.coordinates.lng}
              lat={current.coordinates.lat}
              label={current.name}
            />
          </ArchMap>
        </div>
      </div>
    </AbsoluteFill>
  );
};
