import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import { BEAT, FLY_FRAC } from "./lib/timeline";
import { getReelVisuals, type ReelGeometry, type ReelFrame } from "./lib/reel-visuals";
import {
  walkViewport, fitViewport, BUILDING_ZOOM, FALLBACK_VP, type MapViewport,
} from "./lib/viewport";
import type { ReelBuilding } from "./lib/config";
import { Hero } from "./components/Hero";
import { Caption } from "./components/Caption";
import { Timeline, TIMELINE_H } from "./components/Timeline";
import { HookTitle } from "./components/HookTitle";
import { CtaLockup } from "./components/CtaLockup";

// Force dark once at module load: the theme store + body attribute drive our
// CSS variables, and `colorScheme` flips the browser media feature so embedded
// SVGs (favicon.svg) render dark under headless Chrome, which defaults to light.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

// Composition geometry (1920×1080). PAD = outer padding; GAP between the two
// grid columns; TL_W = left-column width the timeline spans. TIMELINE_H comes
// from the Timeline component so the corner landing lines up exactly.
const PAD = 72;
const GAP = 48;
const TL_W = (1920 - 2 * PAD - GAP) / 2;
const GEO: ReelGeometry = { PAD, TL_W, TIMELINE_H, PANEL_W: 1920, PANEL_H: 1080 };

/** Buildings-aware camera: which viewport each beat shows. Pure, module scope. */
function reelViewport(f: ReelFrame, buildings: ReelBuilding[], worldVP: MapViewport): MapViewport {
  if (f.beat === BEAT.ESTABLISH) return worldVP;
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
  const f = count ? getReelVisuals(frame, count, GEO) : null;

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

  // World view for ESTABLISH + slot-0 fly source.
  const worldVP = useMemo(() => (count ? fitViewport(buildings, 2) : FALLBACK_VP), [buildings, count]);
  const vp = f ? reelViewport(f, buildings, worldVP) : FALLBACK_VP;
  useMapCamera(map, vp, f?.cameraMoving ?? false);

  if (!cfg || !f) return null;
  const current = buildings[f.currentIndex];

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))", padding: PAD }}>
      {f.beat === BEAT.HOOK ? <HookTitle architect={cfg.architect} /> : null}
      {f.beat === BEAT.CTA ? <CtaLockup ctaFrame={f.ctaFrame} /> : null}

      {/* WALK grid (fading in from late ESTABLISH): 50/50 — left cover/text, right map.
          Bottom space is reserved so the sliding timeline layer never overlaps it. */}
      {f.showGrid ? (
        <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, minHeight: 0, opacity: f.gridOpacity }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                paddingBottom: TIMELINE_H + 16,
                opacity: f.contentOpacity,
                transform: `translateX(${f.contentX}px)`,
              }}
            >
              <Hero slug={cfg.slug} buildingSlug={current.slug} />
              <Caption
                name={current.name}
                year={current.year}
                city={current.city}
                countryCode={current.countryCode}
              />
            </div>
          </div>
          <div style={{ position: "relative", minHeight: 0, borderRadius: "var(--size-border-radius)", overflow: "hidden" }}>
            <ArchMap
              ref={setMap}
              architectures={archSummaries}
              selectedSlug={current.slug}
              ready
              capture
            />
          </div>
        </div>
      ) : null}

      {/* Single timeline layer: centered during ESTABLISH, eased to the
          bottom-left corner as WALK begins. */}
      {f.inWalkEra ? (
        <div
          style={{
            position: "absolute",
            left: f.tlLeft,
            top: f.tlTop,
            width: TL_W,
            opacity: f.tlOpacity,
            transform: `scale(${f.tlScale})`,
            transformOrigin: "top left",
            zIndex: 5,
          }}
        >
          <Timeline slug={cfg.slug} buildings={buildings} position={f.carouselPos} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
