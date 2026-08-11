import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import { BEAT, FLY_FRAC, WALK_SLOT_S, WALK_START, secToFrames } from "./lib/timeline";
import { getReelVisuals, type ReelFrame } from "./lib/reel-visuals";
import {
  walkViewport, fitViewport, BUILDING_ZOOM, FALLBACK_VP, type MapViewport,
} from "./lib/viewport";
import { reelTitle, type ReelBuilding } from "./lib/config";
import { CardCarousel } from "./components/CardCarousel";
import { BuildingCaption } from "./components/BuildingCaption";
import { CornerBrand } from "./components/CornerBrand";
import { CtaLockup } from "./components/CtaLockup";
import { HookLockup } from "./components/HookLockup";

// Force dark once at module load: the theme store + body attribute drive our
// CSS variables, and `colorScheme` flips the browser media feature so embedded
// SVGs (favicon.svg) render dark under headless Chrome, which defaults to light.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

const BRAND_INSET = 56;            // right-edge inset for the corner brand
const BRAND_VERT = 56;             // top/bottom inset for the corner brand
// HOOK title sits in the right zone, left-anchored just past the gradient so it
// reads into the same lane the carousel will occupy. Tunable.
const HOOK_TITLE_LEFT = "55%";   // left edge of the title block
const HOOK_TITLE_RIGHT = "8%";   // right inset
const SLOT_FRAMES = secToFrames(WALK_SLOT_S);

// Map→bg layout (fractions of screen width), all tunable. Left→right the screen
// reads: map fully visible → GRADIENT_W band fading map→bg → FULL_BG_RIGHT solid
// bg. The image stack's center axis sits STACK_AXIS_FROM_RIGHT in from the edge.
const FULL_BG_RIGHT = 0.25;            // right 35% is pure bg (no map bleed)
const GRADIENT_W = 0.35;               // 25% gradient band before the full-bg zone
const MAP_FRAC = 1 - FULL_BG_RIGHT;            // map div spans up to the full-bg edge (70%)
const GRADIENT_START = MAP_FRAC - GRADIENT_W;  // gradient begins here (50%)
const STACK_AXIS_FROM_RIGHT = 0.25;            // image-stack center axis, 25% in from the right
const STACK_AXIS = 1 - STACK_AXIS_FROM_RIGHT;          // axis as fraction from left (75%)
const STACK_LEFT = Math.max(0, 2 * STACK_AXIS - 1);    // div left (right:0) so center = axis

/** Buildings-aware camera: which viewport each beat shows. Pure, module scope.
 *  HOOK holds the world fit; WALK (incl. slot 0's world→building fly) uses
 *  walkViewport; CTA holds on the last building. */
function reelViewport(f: ReelFrame, buildings: ReelBuilding[], worldVP: MapViewport): MapViewport {
  if (f.beat === BEAT.HOOK) return worldVP;
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

  // World view: HOOK's held map, and slot-0's fly source (world → building[0]).
  const worldVP = useMemo(() => (count ? fitViewport(buildings, 2) : FALLBACK_VP), [buildings, count]);
  const vp = f ? reelViewport(f, buildings, worldVP) : FALLBACK_VP;
  useMapCamera(map, vp, f?.cameraMoving ?? false);

  if (!cfg || !f) return null;

  const inWalk = f.beat === BEAT.WALK;
  const showMap = f.beat === BEAT.HOOK || f.beat === BEAT.WALK;

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      {/* Map in the left 70% (HOOK + WALK); the building pin centers within it →
          lands in the left half of the screen. During HOOK no pin is selected so
          all architects show at equal weight; fades out into CTA. */}
      {showMap ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: `${MAP_FRAC * 100}%`, height: "100%", opacity: f.mapOpacity, zIndex: 1 }}>
          <AbsoluteFill>
            <ArchMap
              ref={setMap}
              architectures={archSummaries}
              selectedSlug={inWalk ? buildings[f.currentIndex].slug : undefined}
              ready
              capture
            />
          </AbsoluteFill>
        </div>
      ) : null}

      {/* Map→bg gradient overlay. OPAQUE (never fades) so the map's covered edge
          stays covered through the WALK→CTA transition — no full-map flash. The
          gradient band (GRADIENT_START→MAP_FRAC) softens the map edge into bg;
          everything right of MAP_FRAC is solid bg. */}
      {showMap ? (
        <AbsoluteFill
          style={{
            zIndex: 2,
            pointerEvents: "none",
            background: `linear-gradient(to right, transparent 0%, transparent ${GRADIENT_START * 100}%, rgb(var(--color-primary-background)) ${MAP_FRAC * 100}%)`,
          }}
        />
      ) : null}

      {/* HOOK title: descriptive title on the right, soft-blur reveal, blur-out exit
          across the slot-0 fly (synced via exitStart = WALK_START). */}
      {f.hookTitle ? (
        <div style={{ position: "absolute", left: HOOK_TITLE_LEFT, right: HOOK_TITLE_RIGHT, top: 0, bottom: 0, zIndex: 5 }}>
          <HookLockup title={reelTitle(cfg.architect)} frame={frame} exitStart={WALK_START} />
        </div>
      ) : null}

      {/* Vertical card carousel, centered on the bg zone (STACK_AXIS). */}
      {inWalk ? (
        <div
          style={{
            position: "absolute",
            left: `${STACK_LEFT * 100}%`,
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
          />
        </div>
      ) : null}

      {/* Bottom-left building caption (name + year · location): fg text floating
          over the map, soft-blur reveal after the card snap settles. Keyed by the
          focused index so each building remounts for a fresh reveal. */}
      {inWalk ? (
        <BuildingCaption
          key={f.currentIndex}
          building={buildings[f.currentIndex]}
          slotFrame={Math.round(f.intra * SLOT_FRAMES)}
          opacity={f.chromeOpacity}
        />
      ) : null}

      {/* Corner brand on the right edge: architect top-right, @nolli.map bottom-right. */}
      {inWalk ? (
        <>
          <div style={{ position: "absolute", top: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
            <CornerBrand corner="top" architect={cfg.architect} opacity={f.chromeOpacity} />
          </div>
          <div style={{ position: "absolute", bottom: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
            <CornerBrand corner="bottom" architect={cfg.architect} opacity={f.chromeOpacity} />
          </div>
        </>
      ) : null}

      {f.beat === BEAT.CTA ? <CtaLockup ctaFrame={f.ctaFrame} /> : null}
    </AbsoluteFill>
  );
};
