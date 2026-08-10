import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import { BEAT, FLY_FRAC, WALK_SLOT_S, secToFrames } from "./lib/timeline";
import { getReelVisuals, type ReelFrame } from "./lib/reel-visuals";
import {
  walkViewport, fitViewport, BUILDING_ZOOM, FALLBACK_VP, type MapViewport,
} from "./lib/viewport";
import type { ReelBuilding } from "./lib/config";
import { CARD_W } from "./lib/card-carousel";
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
const FLY_FRAMES = secToFrames(FLY_FRAC * WALK_SLOT_S);

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
  // Name reveal for the centered card: frames since the fly completed (center crossing).
  const centerRevealFrame = Math.max(0, Math.round(f.intra * SLOT_FRAMES) - FLY_FRAMES);

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      {/* Full-bleed map (WALK only); fades out into CTA with the chrome. */}
      {inWalk ? (
        <AbsoluteFill style={{ opacity: f.chromeOpacity, zIndex: 1 }}>
          <ArchMap
            ref={setMap}
            architectures={archSummaries}
            selectedSlug={buildings[f.currentIndex].slug}
            ready
            capture
          />
        </AbsoluteFill>
      ) : null}

      {/* Map → bg gradient on the right (cards + brand sit on the solid-bg side). */}
      {inWalk ? (
        <AbsoluteFill
          style={{
            opacity: f.chromeOpacity,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(to right, transparent 0%, transparent 48%, rgb(var(--color-primary-background)) 66%)",
          }}
        />
      ) : null}

      {/* Vertical card carousel, centered in the right bg zone. */}
      {inWalk ? (
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: 0,
            bottom: 0,
            width: CARD_W,
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
