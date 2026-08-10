import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import { BEAT, FLY_FRAC, WALK_SLOT_S, SNAP_S, secToFrames } from "./lib/timeline";
import { getReelVisuals, type ReelFrame } from "./lib/reel-visuals";
import {
  walkViewport, fitViewport, BUILDING_ZOOM, FALLBACK_VP, type MapViewport,
} from "./lib/viewport";
import type { ReelBuilding } from "./lib/config";
import { CardCarousel } from "./components/CardCarousel";
import { CornerBrand } from "./components/CornerBrand";
import { CtaLockup } from "./components/CtaLockup";

// Force dark once at module load: the theme store + body attribute drive our
// CSS variables, and `colorScheme` flips the browser media feature so embedded
// SVGs (favicon.svg) render dark under headless Chrome, which defaults to light.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

const BRAND_INSET = 56;            // right-edge inset for the corner brand
const SLOT_FRAMES = secToFrames(WALK_SLOT_S);
const SNAP_FRAMES = secToFrames(SNAP_S);   // card name reveals after the 0.5s slide snap
const MAP_WIDTH = "70%";           // map occupies the left 70%; pin centers at ~35% of screen

/** Buildings-aware camera: which viewport each beat shows. Pure, module scope.
 *  WALK (incl. slot 0's world→building fly, the opener) uses walkViewport; CTA
 *  holds on the last building. */
function reelViewport(f: ReelFrame, buildings: ReelBuilding[], worldVP: MapViewport): MapViewport {
  if (f.beat === BEAT.CTA) {
    const last = buildings[buildings.length - 1];
    return { center: [last.coordinates.lng, last.coordinates.lat], zoom: BUILDING_ZOOM };
  }
  return walkViewport(buildings, f.currentIndex, f.intra, BUILDING_ZOOM, {
    flyFrac: FLY_FRAC,
    worldCenter: worldVP.center,
    worldZoom: worldVP.zoom,
  });
}

export const ReelComposition: React.FC<{ slug: string }> = ({ slug }) => {
  const frame = useCurrentFrame();
  const cfg = useReelConfig(slug);
  const [map, setMap] = useState<MapRef | null>(null);

  const buildings = cfg?.buildings ?? [];
  const count = buildings.length;
  const f = count ? getReelVisuals(frame, count) : null;

  // ArchMap only reads coordinates (it doesn't render covers), so width/height
  // are zeros that just satisfy the ArchSummary cover shape.
  const archSummaries = useMemo<ArchSummary[]>(
    () =>
      (cfg?.buildings ?? []).map((b, i) => ({
        id: i, slug: b.slug, name: b.name, architect: cfg!.architect, year: b.year,
        coordinates: b.coordinates, cover: { image: b.coverImage, width: 0, height: 0 },
      })),
    [cfg],
  );

  // World view: slot-0 fly source (the opener flies world → building[0]).
  const worldVP = useMemo(() => (count ? fitViewport(buildings, 2) : FALLBACK_VP), [buildings, count]);
  const vp = f ? reelViewport(f, buildings, worldVP) : FALLBACK_VP;
  useMapCamera(map, vp, f?.cameraMoving ?? false);

  if (!cfg || !f) return null;

  const inWalk = f.beat === BEAT.WALK;
  // Name reveal for the centered card: frames since the 0.5s slide snap completed.
  const centerRevealFrame = Math.max(0, Math.round(f.intra * SLOT_FRAMES) - SNAP_FRAMES);

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      {/* Map in the left 70% (WALK only); the building pin centers within it →
          lands in the left half of the screen. Fades out into CTA with the chrome. */}
      {inWalk ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: MAP_WIDTH, height: "100%", opacity: f.chromeOpacity, zIndex: 1 }}>
          <AbsoluteFill>
            <ArchMap
              ref={setMap}
              architectures={archSummaries}
              selectedSlug={buildings[f.currentIndex].slug}
              ready
              capture
            />
          </AbsoluteFill>
        </div>
      ) : null}

      {/* Seam + bg zone overlay. OPAQUE (never fades) so the map's covered edge
          stays covered through the WALK→CTA transition — no full-map flash. It
          only softens the ~62→72% seam; everything right of 72% is solid bg. */}
      {inWalk ? (
        <AbsoluteFill
          style={{
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(to right, transparent 0%, transparent 62%, rgb(var(--color-primary-background)) 72%)",
          }}
        />
      ) : null}

      {/* Vertical card carousel in the right bg zone (breathing room left of it). */}
      {inWalk ? (
        <div
          style={{
            position: "absolute",
            left: "72%",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 4,
            opacity: f.chromeOpacity,
          }}
        >
          <CardCarousel
            slug={cfg.slug}
            buildings={buildings}
            position={f.carouselPos}
            centerRevealFrame={centerRevealFrame}
          />
        </div>
      ) : null}

      {/* Corner brand on the right edge: architect top-right, @nolli.map bottom-right. */}
      {inWalk ? (
        <>
          <div style={{ position: "absolute", top: 28, right: BRAND_INSET, zIndex: 6 }}>
            <CornerBrand corner="top" architect={cfg.architect} opacity={f.chromeOpacity} />
          </div>
          <div style={{ position: "absolute", bottom: 28, right: BRAND_INSET, zIndex: 6 }}>
            <CornerBrand corner="bottom" architect={cfg.architect} opacity={f.chromeOpacity} />
          </div>
        </>
      ) : null}

      {f.beat === BEAT.CTA ? <CtaLockup ctaFrame={f.ctaFrame} /> : null}
    </AbsoluteFill>
  );
};
