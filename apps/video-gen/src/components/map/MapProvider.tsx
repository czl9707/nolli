// apps/video-gen/src/components/map/MapProvider.tsx
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { Map, getMapStyle, fetchAndCache, type MapRef, type CachedImage } from "@nolli/map";

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

/** Publish `selectedSlug` to the map from a Flight/Hold. Effect-only (never
 *  render): a parent state setter during render trips React's update-while-
 *  rendering warning. Shared so the segment components can't drift. */
export function useSelectedSlug(selectedSlug?: string): void {
  const { setSegmentState } = useMapContext();
  useEffect(() => {
    setSegmentState({ selectedSlug });
  }, [selectedSlug, setSegmentState]);
}

export type PlateRect = { left: number; top: number; width: number; height: number };
const DEFAULT_PLATE: PlateRect = { left: 24, top: 24, width: 1032, height: 540 };

/** Mounts the ONE map for the whole reel — a plate positioned by `plate` —
 *  and exposes its ref + the active segment's selectedSlug via context. The
 *  map style is forced by filling BOTH theme slots of <Map> with the
 *  requested basemap. ArchMap can't do this — it hardcodes both styles — so
 *  the exported <Map> is composed directly, with the matching pattern set
 *  applied. A veil ghosts the basemap toward the page ground; markers
 *  render as <Map> children above it. */
export const MapProvider: React.FC<{
  plate?: PlateRect;
  basemap?: "light" | "dark";
  veilOpacity?: number;
  plateRadius?: number;
  worldCopies?: boolean;
  children: ReactNode;
}> = ({ plate = DEFAULT_PLATE, basemap = "dark", veilOpacity = 0, plateRadius = 0, worldCopies, children }) => {
  const [map, setMap] = useState<MapRef | null>(null);
  const [segmentState, setSegmentState] = useState<MapSegmentState>({});
  const patternCache = useRef<Record<string, CachedImage>>({});

  const styles = useMemo(() => {
    const s = getMapStyle(basemap);
    return { light: s, dark: s };
  }, [basemap]);

  // The basemap's fill layers reference pattern images by id; apply the
  // style's OWN set (light or dark), not the store's resolvedTheme (dark page
  // chrome).
  useEffect(() => {
    if (!map) return;
    fetchAndCache(map, basemap, patternCache.current, true);
  }, [map, basemap]);

  // The veil is inserted in the map's canvas container right after the canvas
  // — above the tiles, below every marker (maplibre markers append later in
  // that container), so the cards stay full-strength.
  useEffect(() => {
    if (!map) return;
    const canvas = map.getCanvas();
    const veil = document.createElement("div");
    veil.setAttribute("aria-hidden", "true");
    Object.assign(veil.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      background: "rgb(var(--color-primary-background))",
      opacity: `${veilOpacity}`,
    });
    canvas.parentElement!.insertBefore(veil, canvas.nextSibling);
    return () => {
      veil.remove();
    };
  }, [map]);

  const ctx = useMemo<MapContextValue>(() => ({ map, setSegmentState }), [map]);

  return (
    <MapContext.Provider value={ctx}>
      <div
        style={{
          position: "absolute",
          left: plate.left,
          top: plate.top,
          width: plate.width,
          height: plate.height,
          zIndex: 1,
          borderRadius: plateRadius,
          overflow: "hidden",
          border: "1px solid rgb(var(--color-paper-foreground) / 0.25)",
          boxSizing: "border-box",
        }}
      >
        <AbsoluteFill>
          <Map
            ref={setMap}
            styles={styles}
            canvasContextAttributes={{ preserveDrawingBuffer: true }}
            {...(worldCopies === undefined ? {} : { renderWorldCopies: worldCopies })}
          >
            {children}
          </Map>
        </AbsoluteFill>
      </div>
    </MapContext.Provider>
  );
};
