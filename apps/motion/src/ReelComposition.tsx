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
  WALK_HOLD_S, WALK_SLOT_S, TIMELINE_WINDOW,
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
  const worldVP = useMemo(() => (count ? fitViewport(buildings, 2) : FALLBACK_VP), [buildings, count]);
  const holdFrac = WALK_HOLD_S / WALK_SLOT_S;

  const vp = useMemo(() => {
    if (!count || !st) return FALLBACK_VP;
    if (st.beat === BEAT.ESTABLISH) return worldVP;
    if (st.beat === BEAT.CTA) {
      const last = buildings[count - 1];
      return { center: [last.coordinates.lng, last.coordinates.lat] as [number, number], zoom: CRUISE_ZOOM };
    }
    return walkViewport(buildings, st.currentIndex, st.intra, CRUISE_ZOOM, {
      holdFrac,
      fromWorld: st.currentIndex === 0,
      worldCenter: worldVP.center,
      worldZoom: worldVP.zoom,
    });
  }, [buildings, st, count, worldVP, holdFrac]);
  useMapCamera(map, vp);

  if (!cfg || !st || !current) return null;

  // ESTABLISH → WALK timeline crossfade: large centered timeline scales/fades out
  // as the WALK column (with its compact timeline) fades in.
  const settleEnd = WALK_START;
  const settleStart = WALK_START - Math.round(0.6 * FPS);
  const establishTimelineOpacity = interpolate(frame, [settleStart, settleEnd], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const establishTimelineScale = interpolate(frame, [settleStart, settleEnd], [1, 0.7], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const showEstablishTimeline =
    st.beat === BEAT.ESTABLISH || (st.beat === BEAT.WALK && frame < WALK_START + 1);

  const isWalk = st.beat === BEAT.WALK;

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      {/* Map fills the frame in ESTABLISH/WALK; hidden during HOOK & CTA. */}
      {st.beat === BEAT.ESTABLISH || st.beat === BEAT.WALK ? (
        <div style={{ position: "absolute", inset: 24, borderRadius: "var(--size-border-radius)", overflow: "hidden" }}>
          <ArchMap
            ref={setMap}
            architectures={archSummaries}
            selectedSlug={current.slug}
            ready
            capture
          />
        </div>
      ) : null}

      {st.beat === BEAT.HOOK ? (
        <HookTitle architect={cfg.architect} fromYear={cfg.stats.fromYear} toYear={cfg.stats.toYear} />
      ) : null}

      {/* ESTABLISH: large centered timeline overlay */}
      {showEstablishTimeline ? (
        <div style={{ position: "absolute", inset: 0, opacity: establishTimelineOpacity, transform: `scale(${establishTimelineScale})` }}>
          <Timeline
            slug={cfg.slug}
            buildings={buildings}
            currentIndex={st.currentIndex}
            windowSize={TIMELINE_WINDOW}
            variant="establish"
          />
        </div>
      ) : null}

      {/* WALK: left column with Hero + Caption + compact Timeline */}
      {isWalk ? (
        <div
          style={{
            position: "absolute", left: 24, top: 24, bottom: 24, width: "calc(50% - 36px)",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}
        >
          <Hero slug={cfg.slug} buildingSlug={current.slug} />
          <Caption
            name={current.name}
            year={current.year}
            city={current.city}
            countryCode={current.countryCode}
          />
          <div style={{ paddingTop: 8 }}>
            <Timeline
              slug={cfg.slug}
              buildings={buildings}
              currentIndex={st.currentIndex}
              windowSize={TIMELINE_WINDOW}
              variant="walk"
            />
          </div>
        </div>
      ) : null}

      {st.beat === BEAT.CTA ? <CtaLockup ctaFrame={frame - ctaStart(count)} /> : null}
    </AbsoluteFill>
  );
};
