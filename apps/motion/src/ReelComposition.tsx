import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import {
  getTimelineState, BEAT, WALK_START, ESTABLISH_START, ctaStart, secToFrames, CLAMP,
  WALK_FLY_S, WALK_SLOT_S, TL_SLIDE_LEAD_S, GRID_FADE_LEAD_S,
} from "./lib/timeline";
import { walkViewport, fitViewport, type MapViewport } from "./lib/viewport";
import { Hero } from "./components/Hero";
import { Caption } from "./components/Caption";
import { Timeline, TIMELINE_H } from "./components/Timeline";
import { HookTitle } from "./components/HookTitle";
import { CtaLockup } from "./components/CtaLockup";

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  // Force the browser color-scheme dark so embedded SVGs / CSS that read
  // prefers-color-scheme (e.g. favicon.svg) render in dark mode under headless
  // Chrome, which defaults to light.
  document.documentElement.style.colorScheme = "dark";
}

const CRUISE_ZOOM = 15;
const FALLBACK_VP: MapViewport = { center: [0, 0], zoom: 1 };

// Composition geometry (1920×1080). PAD = outer padding each side; GAP between
// the two grid columns. TL_W = left-column width the timeline spans; TIMELINE_H
// (imported) is the Timeline component's own height so the corner landing lines up.
const PAD = 72;
const GAP = 48;
const TL_W = (1920 - 2 * PAD - GAP) / 2; // = 864

// Per-slot motion consts derived from the timeline seconds (module scope: stable,
// not rebuilt each frame).
const FLY_FRAC = WALK_FLY_S / WALK_SLOT_S;
const ROLL_FRAC = 1 / WALK_SLOT_S; // carousel finishes rolling to the next item in 1s of the 5s slot
const SLOT_FADE = 0.12;
const CONTENT_RAMP = [0, SLOT_FADE, 1 - SLOT_FADE, 1]; // per-building entrance/exit envelope

export const ReelComposition: React.FC<{ slug: string }> = ({ slug }) => {
  const frame = useCurrentFrame();
  const cfg = useReelConfig(slug);
  const [map, setMap] = useState<MapRef | null>(null);

  useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });

  const buildings = cfg?.buildings ?? [];
  const count = buildings.length;
  const st = count ? getTimelineState(frame, count) : null;
  const current = st ? buildings[st.currentIndex] : null;

  const archSummaries = useMemo<ArchSummary[]>(
    () =>
      (cfg?.buildings ?? []).map((b, i) => ({
        id: i, slug: b.slug, name: b.name, architect: cfg!.architect, year: b.year,
        coordinates: b.coordinates, cover: { image: b.coverImage, width: 0, height: 0 },
      })),
    [cfg],
  );

  // World view for ESTABLISH + slot-0 fly source.
  const worldVP = useMemo(() => (count ? fitViewport(buildings, 2) : FALLBACK_VP), [buildings]);

  const vp = useMemo(() => {
    if (!count || !st) return FALLBACK_VP;
    if (st.beat === BEAT.ESTABLISH) return worldVP;
    if (st.beat === BEAT.CTA) {
      const last = buildings[count - 1];
      return { center: [last.coordinates.lng, last.coordinates.lat] as [number, number], zoom: CRUISE_ZOOM };
    }
    return walkViewport(buildings, st.currentIndex, st.intra, CRUISE_ZOOM, {
      flyFrac: FLY_FRAC,
      worldCenter: worldVP.center,
      worldZoom: worldVP.zoom,
    });
  }, [buildings, st, count, worldVP]);
  useMapCamera(map, vp);

  if (!cfg || !st || !current) return null;

  // Continuous carousel position: during each slot's fly-in it rolls from the
  // previous building into the current one; during the hold it rests on current.
  // The roll is decoupled from the map fly (1s vs 3s) so the list advances
  // briskly while the map glides.
  const rollT = Math.min(1, st.intra / ROLL_FRAC);
  const carouselPos = Math.max(0, st.currentIndex - (1 - rollT));

  // ESTABLISH → WALK hand-off: the single timeline layer physically slides from
  // screen-center to the bottom-left corner, then the map + cover/text fade in
  // around it. The slide finishes before the fade begins (serialized windows in
  // timeline.ts via TL_SLIDE_LEAD_S / GRID_FADE_LEAD_S) so the two never overlap.
  const slideStart = WALK_START - secToFrames(TL_SLIDE_LEAD_S);
  const gridStart = WALK_START - secToFrames(GRID_FADE_LEAD_S);
  const tlEaseT = interpolate(frame, [slideStart, gridStart], [0, 1], CLAMP);
  const gridOpacity = interpolate(frame, [gridStart, WALK_START], [0, 1], CLAMP);

  // One timeline element. Centered during ESTABLISH, eased to the bottom-left
  // corner (exactly the WALK left-column footer) for WALK.
  const tlLeft = interpolate(tlEaseT, [0, 1], [(1920 - TL_W) / 2, PAD]);
  const tlTop = interpolate(tlEaseT, [0, 1], [(1080 - TIMELINE_H) / 2, 1080 - PAD - TIMELINE_H]);
  const tlScale = interpolate(tlEaseT, [0, 1], [1.12, 1]);
  const establishIn = interpolate(frame, [ESTABLISH_START, ESTABLISH_START + secToFrames(0.3)], [0, 1], CLAMP);
  const ctaStartFrame = ctaStart(count);
  const ctaIn = interpolate(frame, [ctaStartFrame - secToFrames(0.4), ctaStartFrame], [0, 1], CLAMP);
  // Crossfades out across the WALK→CTA boundary (ctaIn ramps to 1 as CTA begins).
  const tlOpacity = (1 - ctaIn) * establishIn;
  const inWalkEra = st.beat === BEAT.ESTABLISH || st.beat === BEAT.WALK;
  const showGrid = inWalkEra && frame >= gridStart;

  // Per-building cover/text entrance+exit: fades in over the first slice of each
  // slot, holds, fades out over the last slice — and slides in from the right,
  // out to the left, mirroring the carousel's roll direction. st.intra is 0..1
  // within the slot (0 in ESTAB).
  const contentOpacity = interpolate(st.intra, CONTENT_RAMP, [0, 1, 1, 0], CLAMP);
  const contentX = interpolate(st.intra, CONTENT_RAMP, [56, 0, 0, -56], CLAMP);

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))", padding: PAD }}>
      {st.beat === BEAT.HOOK ? <HookTitle architect={cfg.architect} /> : null}

      {st.beat === BEAT.CTA ? <CtaLockup ctaFrame={frame - ctaStartFrame} /> : null}

      {/* WALK grid (fading in from late ESTABLISH): 50/50 — left cover/text, right map.
          Bottom space is reserved so the sliding timeline layer never overlaps it. */}
      {showGrid ? (
        <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, minHeight: 0, opacity: gridOpacity }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                paddingBottom: TIMELINE_H + 16,
                opacity: contentOpacity,
                transform: `translateX(${contentX}px)`,
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

      {/* Single timeline layer: centered during ESTABLISH, physically eased to the
          bottom-left corner as WALK begins. */}
      {inWalkEra ? (
        <div
          style={{
            position: "absolute",
            left: tlLeft,
            top: tlTop,
            width: TL_W,
            opacity: tlOpacity,
            transform: `scale(${tlScale})`,
            transformOrigin: "top left",
            zIndex: 5,
          }}
        >
          <Timeline slug={cfg.slug} buildings={buildings} position={carouselPos} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
