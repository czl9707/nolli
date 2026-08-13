import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { CLAMP, ctaStart, secToFrames, BRAND_FADE_OUT_LEAD_S } from "../lib/timeline";
import { useAllBuildings } from "../lib/use-all-buildings";

// Force dark once at module load (moved from ReelComposition — the map's theming
// lives with the map now). colorScheme flips the browser media feature so embedded
// SVGs render dark under headless Chrome (which defaults to light).
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

/** What a camera segment publishes to the map. Callers (Flight/Hold) MUST
 *  invoke `setSegmentState` from a `useEffect` (NOT during render) — calling a
 *  parent's state setter during render trips React's "cannot update a component
 *  while rendering a different component" warning at each value change. */
export type MapSegmentState = {
  /** Slug to highlight (undefined = none). Set by the active Flight/Hold. */
  selectedSlug?: string;
};

type MapContextValue = {
  map: MapRef | null;
  setSegmentState: (s: MapSegmentState) => void;
};

export const MapContext = createContext<MapContextValue | null>(null);

/** For camera segments (Flight/Hold) to read the map ref + publish selectedSlug. */
export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside <MapProvider>");
  return ctx;
}

/** Publish `selectedSlug` to the map from a Flight/Hold. Encapsulates the
 *  MapSegmentState contract (MUST publish from a useEffect, never during render)
 *  so the two segment components can't drift from it. */
export function useSelectedSlug(selectedSlug?: string): void {
  const { setSegmentState } = useMapContext();
  useEffect(() => {
    setSegmentState({ selectedSlug });
  }, [selectedSlug, setSegmentState]);
}

// Map→bg layout (fractions of screen width).
const FULL_BG_RIGHT = 0.25;       // right 25% is pure bg (no map bleed)
const GRADIENT_W = 0.35;          // 35% gradient band before the full-bg zone
const MAP_FRAC = 1 - FULL_BG_RIGHT;        // map div spans up to the full-bg edge (0.75)
const GRADIENT_START = MAP_FRAC - GRADIENT_W;  // gradient begins here (0.4)

/**
 * Mounts the ONE <ArchMap> instance for the whole reel and exposes its ref +
 * the active segment's selectedSlug via context. A context provider ONLY — not
 * a layout/positioning wrapper for children (children render as-is; z-index
 * stacking of beats/title/carousel is unchanged).
 *
 * Pin field is ALWAYS the full Nolli DB (no world/architect switching). Only
 * selectedSlug is dynamic (segment-published). Owns mapOpacity (fade-out into
 * CTA) from its own useCurrentFrame(). Renders the map + the opaque gradient
 * overlay; hides both once CTA begins (frame >= cta).
 */
export const MapProvider: React.FC<{
  count: number;
  children: ReactNode;
}> = ({ count, children }) => {
  const frame = useCurrentFrame();
  const allBuildings = useAllBuildings();
  const [map, setMap] = useState<MapRef | null>(null);
  const [segmentState, setSegmentState] = useState<MapSegmentState>({});

  const cta = ctaStart(count);
  const fadeOut = interpolate(frame, [cta - secToFrames(BRAND_FADE_OUT_LEAD_S), cta], [0, 1], CLAMP);
  const mapOpacity = 1 - fadeOut;
  const showMap = frame < cta; // HOOK + WALK; map fades out into CTA then hides

  const allSummaries = useMemo<ArchSummary[]>(
    () =>
      (allBuildings ?? []).map((b) => ({
        id: b.id, slug: b.slug, name: b.name, architect: "", year: 0,
        coordinates: b.coordinates, cover: { image: "", width: 0, height: 0 },
      })),
    [allBuildings],
  );

  const ctx = useMemo<MapContextValue>(() => ({ map, setSegmentState }), [map]);

  return (
    <MapContext.Provider value={ctx}>
      {showMap ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: `${MAP_FRAC * 100}%`, height: "100%", opacity: mapOpacity, zIndex: 1 }}>
          <AbsoluteFill>
            <ArchMap
              ref={setMap}
              architectures={allSummaries}
              selectedSlug={segmentState.selectedSlug}
              ready
              capture
            />
          </AbsoluteFill>
        </div>
      ) : null}
      {showMap ? (
        <AbsoluteFill
          style={{
            zIndex: 2,
            pointerEvents: "none",
            background: `linear-gradient(to right, transparent 0%, transparent ${GRADIENT_START * 100}%, rgb(var(--color-primary-background)) ${MAP_FRAC * 100}%)`,
          }}
        />
      ) : null}
      {children}
    </MapContext.Provider>
  );
};
