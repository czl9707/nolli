import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { CLAMP, ctaStart, secToFrames, BRAND_FADE_OUT_LEAD_S } from "../lib/timeline";
import { useStaticJson } from "../lib/use-static-json";

/** One architecture pin from the seed-generated `all-arch.json` (every
 *  architecture in the DB), used to scatter the full pin field on the HOOK map. */
type ArchPin = {
  id: number;
  slug: string;
  name: string;
  coordinates: { lng: number; lat: number };
};

// Force dark once at module load. colorScheme flips the browser media feature so
// embedded SVGs render dark under headless Chrome (which defaults to light).
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

export type MapSegmentState = {
  selectedSlug?: string;
};

type MapContextValue = {
  map: MapRef | null;
  setSegmentState: (s: MapSegmentState) => void;
};

export const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside <MapProvider>");
  return ctx;
}

/** Publish `selectedSlug` to the map from a Flight/Hold. MUST be called from a
 *  useEffect (never during render) — a parent state setter during render trips
 *  React's "cannot update a component while rendering a different component"
 *  warning. Encapsulated here so the two segment components can't drift. */
export function useSelectedSlug(selectedSlug?: string): void {
  const { setSegmentState } = useMapContext();
  useEffect(() => {
    setSegmentState({ selectedSlug });
  }, [selectedSlug, setSegmentState]);
}

// Map→bg layout (fractions of screen width): map spans the left 75%, a 35%
// gradient band, then a pure-bg right 25%.
const FULL_BG_RIGHT = 0.25;
const GRADIENT_W = 0.35;
const MAP_FRAC = 1 - FULL_BG_RIGHT;
const GRADIENT_START = MAP_FRAC - GRADIENT_W;

/** Mounts the ONE <ArchMap> for the whole reel and exposes its ref + the active
 *  segment's selectedSlug via context. The pin field is always the full Nolli
 *  DB; only selectedSlug is dynamic. Fades out into CTA. */
export const MapProvider: React.FC<{
  count: number;
  children: ReactNode;
}> = ({ count, children }) => {
  const frame = useCurrentFrame();
  const allPins = useStaticJson<ArchPin[]>("data/all-arch.json", "load all-arch.json");
  const [map, setMap] = useState<MapRef | null>(null);
  const [segmentState, setSegmentState] = useState<MapSegmentState>({});

  const cta = ctaStart(count);
  const fadeOut = interpolate(frame, [cta - secToFrames(BRAND_FADE_OUT_LEAD_S), cta], [0, 1], CLAMP);
  const mapOpacity = 1 - fadeOut;
  const showMap = frame < cta; // HOOK + WALK; map fades out into CTA then hides

  const allSummaries = useMemo<ArchSummary[]>(
    () =>
      (allPins ?? []).map((p) => ({
        id: p.id, slug: p.slug, name: p.name, architect: "", year: 0,
        coordinates: p.coordinates, cover: { image: "", width: 0, height: 0 },
      })),
    [allPins],
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
