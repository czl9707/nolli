import { AbsoluteFill, Sequence, Series, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import { BEAT, FLY_FRAC, SLOT_FRAMES, CTA_S, WALK_START, ctaStart, secToFrames } from "./lib/timeline";
import { getReelVisuals, type ReelFrame } from "./lib/reel-visuals";
import {
  walkViewport, fitViewport, BUILDING_ZOOM, FALLBACK_VP, type MapViewport,
} from "./lib/viewport";
import { reelTitle, type ReelBuilding } from "./lib/config";
import { useAllBuildings } from "./lib/use-all-buildings";
import { CardCarousel } from "./components/CardCarousel";
import { BuildingCaption } from "./components/BuildingCaption";
import { CornerBrand } from "./components/CornerBrand";
import { CtaLockup } from "./components/CtaLockup";
import { HookLockup, HOOK_EXIT_F } from "./components/HookLockup";

// Force dark once at module load: the theme store + body attribute drive our
// CSS variables, and `colorScheme` flips the browser media feature so embedded
// SVGs (favicon.svg) render dark under headless Chrome, which defaults to light.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

const BRAND_INSET = 48;            // right-edge inset for the corner brand
const BRAND_VERT = 36;             // top/bottom inset for the corner brand
// HOOK title sits in the right zone, left-anchored just past the gradient so it
// reads into the same lane the carousel will occupy. Tunable.
const HOOK_TITLE_LEFT = "55%";   // left edge of the title block
const HOOK_TITLE_RIGHT = "8%";   // right inset
// WALK span length, used by the WALK <Sequence>.
const walkFrames = (count: number) => count * SLOT_FRAMES;
// HOOK title Sequence runs HOOK + its blur-out exit tail (the exit crosses WALK_START).

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
  const allBuildings = useAllBuildings();
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

  // The full Nolli DB as map pins (HOOK only). The map reads just slug/name/
  // coordinates, so the unused ArchSummary fields are stubbed.
  const allSummaries = useMemo<ArchSummary[]>(
    () =>
      (allBuildings ?? []).map((b) => ({
        id: b.id, slug: b.slug, name: b.name, architect: "", year: 0,
        coordinates: b.coordinates, cover: { image: "", width: 0, height: 0 },
      })),
    [allBuildings],
  );

  // World view: HOOK's held map (the whole Nolli DB) + slot-0's fly source.
  // Prefer the full DB fit so HOOK scatters every building; fall back to the
  // architect footprint if the global list hasn't loaded yet.
  const worldVP = useMemo(
    () =>
      allBuildings && allBuildings.length
        ? fitViewport(allBuildings, 2)
        : count
          ? fitViewport(buildings, 2)
          : FALLBACK_VP,
    [allBuildings, buildings, count],
  );
  const vp = f ? reelViewport(f, buildings, worldVP) : FALLBACK_VP;
  useMapCamera(map, vp, f?.cameraMoving ?? false);

  if (!cfg || !f) return null;

  const inWalk = f.beat === BEAT.WALK;
  const showMap = f.beat === BEAT.HOOK || f.beat === BEAT.WALK;
  // Map pin field = whole DB during HOOK + slot-0's world→b0 fly (was ReelFrame.hookTitle).
  const hookPinField = f.beat === BEAT.HOOK || (inWalk && f.currentIndex === 0 && f.intra < FLY_FRAC);

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      {/* Map in the left 70% (HOOK + WALK). During HOOK (+ the slot-0 fly) the pin
          field is the whole Nolli DB, none selected; once the fly settles it
          switches to this architect's buildings with the focused one highlighted.
          The switch lands at fly-end when we're zoomed in, so the dropped pins are
          off-screen. Fades out into CTA. */}
      {showMap ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: `${MAP_FRAC * 100}%`, height: "100%", opacity: f.mapOpacity, zIndex: 1 }}>
          <AbsoluteFill>
            <ArchMap
              ref={setMap}
              architectures={hookPinField ? allSummaries : archSummaries}
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

      {/* HOOK title: descriptive title, present from the Sequence's first frame
          (no entrance), right-aligned + vertically centered in the right zone;
          blur-out exit across the slot-0 fly. The Sequence spans HOOK + the exit
          tail so the full settled→exit lifecycle lives in one local clock. */}
      <Sequence from={0} durationInFrames={WALK_START + HOOK_EXIT_F} layout="none">
        <div
          style={{
            position: "absolute",
            left: HOOK_TITLE_LEFT,
            right: HOOK_TITLE_RIGHT,
            top: 0,
            bottom: 0,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <HookLockup title={reelTitle(cfg.architect)} />
        </div>
      </Sequence>

      {/* WALK beat. One Sequence over the whole WALK span: the carousel is a
          continuous child (its scroll position is a single value across WALK,
          driven by f.carouselPos from the absolute-frame resolver), and the
          building captions are a <Series> of per-building Series.Sequences —
          each gives its caption a fresh slot-relative clock via useCurrentFrame.
          Corner brand overlays through WALK on the bg zone. The Sequence handles
          WALK presence (mounts only during WALK); chromeOpacity still drives the
          slot-0 fade-in. */}
      <Sequence from={WALK_START} durationInFrames={walkFrames(count)} layout="none">
        {/* Continuous vertical card carousel, centered on the bg zone. */}
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
          <CardCarousel slug={cfg.slug} buildings={buildings} position={f.carouselPos} />
        </div>

        {/* Per-building captions: one Series.Sequence per building, each a fresh
            slot-relative clock. The natural per-instance remount replaces the old
            key={currentIndex} remount. */}
        <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
          <Series>
            {buildings.map((b) => (
              <Series.Sequence key={b.slug} durationInFrames={SLOT_FRAMES} layout="none">
                <BuildingCaption building={b} opacity={f.chromeOpacity} />
              </Series.Sequence>
            ))}
          </Series>
        </div>

        {/* Corner brand on the right edge: architect top-right, @nolli.map bottom-right. */}
        <div style={{ position: "absolute", top: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
          <CornerBrand corner="top" architect={cfg.architect} opacity={f.chromeOpacity} />
        </div>
        <div style={{ position: "absolute", bottom: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
          <CornerBrand corner="bottom" architect={cfg.architect} opacity={f.chromeOpacity} />
        </div>
      </Sequence>

      {/* CTA beat. One Sequence from ctaStart; CtaLockup reads useCurrentFrame()
          for its CTA-relative clock. */}
      <Sequence from={ctaStart(count)} durationInFrames={secToFrames(CTA_S)} layout="none">
        <CtaLockup />
      </Sequence>
    </AbsoluteFill>
  );
};
