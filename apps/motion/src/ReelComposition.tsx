import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ArchMap } from "@nolli/map";
import type { MapRef } from "@nolli/map";
import type { ArchSummary } from "@nolli/data";
import { useThemeStore } from "@nolli/ui";
import { useMemo, useState } from "react";
import { useReelConfig } from "./lib/use-reel-config";
import { useMapCamera } from "./lib/use-map-camera";
import {
  getTimelineState, BEAT, WALK_START, ctaStart, FPS,
  WALK_FLY_S, WALK_SLOT_S,
} from "./lib/timeline";
import { walkViewport, fitViewport, type MapViewport } from "./lib/viewport";
import { Hero } from "./components/Hero";
import { Caption } from "./components/Caption";
import { Timeline } from "./components/Timeline";
import { HookTitle } from "./components/HookTitle";
import { CtaLockup } from "./components/CtaLockup";

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" });
if (typeof document !== "undefined") document.body.dataset.theme = "dark";

const CRUISE_ZOOM = 15;
const FALLBACK_VP: MapViewport = { center: [0, 0], zoom: 1 };

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
  const flyFrac = WALK_FLY_S / WALK_SLOT_S;

  const vp = useMemo(() => {
    if (!count || !st) return FALLBACK_VP;
    if (st.beat === BEAT.ESTABLISH) return worldVP;
    if (st.beat === BEAT.CTA) {
      const last = buildings[count - 1];
      return { center: [last.coordinates.lng, last.coordinates.lat] as [number, number], zoom: CRUISE_ZOOM };
    }
    return walkViewport(buildings, st.currentIndex, st.intra, CRUISE_ZOOM, {
      flyFrac,
      worldCenter: worldVP.center,
      worldZoom: worldVP.zoom,
    });
  }, [buildings, st, count, worldVP, flyFrac]);
  useMapCamera(map, vp);

  if (!cfg || !st || !current) return null;

  // Continuous carousel position: during each slot's fly-in it rolls from the
  // previous building into the current one; during the hold it rests on current.
  const flyT = Math.min(1, st.intra / flyFrac);
  const carouselPos = Math.max(0, st.currentIndex - (1 - flyT));

  // Hero/caption fade in as WALK begins (the timeline is visible from ESTABLISH).
  const walkContentOpacity = st.beat === BEAT.WALK
    ? interpolate(frame, [WALK_START, WALK_START + Math.round(0.4 * FPS)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  const isWalk = st.beat === BEAT.WALK;
  const isGrid = st.beat === BEAT.ESTABLISH || isWalk;

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))", padding: 24 }}>
      {st.beat === BEAT.HOOK ? (
        <HookTitle architect={cfg.architect} fromYear={cfg.stats.fromYear} toYear={cfg.stats.toYear} />
      ) : null}

      {st.beat === BEAT.CTA ? <CtaLockup ctaFrame={frame - ctaStart(count)} /> : null}

      {/* ESTABLISH & WALK: 50/50 grid — left = cover/text/timeline, right = map. */}
      {isGrid ? (
        <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 0 }}>
          {/* LEFT: cover + text + timeline */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, opacity: walkContentOpacity }}>
              <Hero slug={cfg.slug} buildingSlug={current.slug} />
              <Caption
                name={current.name}
                year={current.year}
                city={current.city}
                countryCode={current.countryCode}
              />
            </div>
            <Timeline
              slug={cfg.slug}
              buildings={buildings}
              position={carouselPos}
              variant={isWalk ? "walk" : "establish"}
            />
          </div>

          {/* RIGHT: map (world view during ESTABLISH, flying during WALK) */}
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
    </AbsoluteFill>
  );
};
