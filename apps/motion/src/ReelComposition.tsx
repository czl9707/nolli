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

  // ESTABLISH → WALK transition (last ~0.8s of ESTABLISH): the centered timeline
  // eases down toward the bottom-left and fades, while the map + cover/text fade
  // in. During ESTABLISH proper there is no map — it appears as WALK begins.
  const easeStart = WALK_START - Math.round(0.8 * FPS);
  const easeT = interpolate(frame, [easeStart, WALK_START], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const establishTlOpacity = 1 - easeT;
  const establishTlY = 220 * easeT;
  const establishTlScale = 1 - 0.35 * easeT;
  const gridOpacity = easeT;
  const showEstablishTimeline = st.beat === BEAT.ESTABLISH || (st.beat === BEAT.WALK && frame < WALK_START + 1);

  const isWalk = st.beat === BEAT.WALK;
  const showGrid = (st.beat === BEAT.ESTABLISH || isWalk) && frame >= easeStart;

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))", padding: 24 }}>
      {st.beat === BEAT.HOOK ? <HookTitle architect={cfg.architect} /> : null}

      {st.beat === BEAT.CTA ? <CtaLockup ctaFrame={frame - ctaStart(count)} /> : null}

      {/* ESTABLISH: centered timeline, no map. Eases to bottom-left as WALK begins. */}
      {showEstablishTimeline ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: establishTlOpacity,
            transform: `translateY(${establishTlY}px) scale(${establishTlScale})`,
          }}
        >
          <div style={{ width: "100%", maxWidth: 1500 }}>
            <Timeline slug={cfg.slug} buildings={buildings} position={carouselPos} variant="establish" />
          </div>
        </div>
      ) : null}

      {/* WALK (fading in from late ESTABLISH): 50/50 grid — left cover/text/timeline, right map. */}
      {showGrid ? (
        <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 0, opacity: gridOpacity }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Hero slug={cfg.slug} buildingSlug={current.slug} />
              <Caption
                name={current.name}
                year={current.year}
                city={current.city}
                countryCode={current.countryCode}
              />
            </div>
            <Timeline slug={cfg.slug} buildings={buildings} position={carouselPos} variant="walk" />
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
    </AbsoluteFill>
  );
};
