import { AbsoluteFill, interpolate, Sequence, Series, useCurrentFrame } from "remotion";
import { useStaticJson } from "./lib/use-static-json";
import {
  SLOT_FRAMES, CTA_S, WALK_START,
  ctaStart, secToFrames, BRAND_FADE_OUT_LEAD_S, CLAMP,
} from "./lib/timeline";
import { WORLD_VP } from "./lib/viewport";
import { reelTitle, yearRange, type ReelBuilding, type ReelConfig } from "./lib/config";
import { CardCarousel } from "./components/CardCarousel";
import { BuildingCaption } from "./components/BuildingCaption";
import { CornerBrand } from "./components/CornerBrand";
import { CtaLockup } from "./components/CtaLockup";
import { HookLockup, HOOK_EXIT_F } from "./components/HookLockup";
import { MapProvider } from "./components/MapProvider";
import { CameraSeries } from "./components/CameraSeries";

const BRAND_INSET = 48;
const BRAND_VERT = 36;
const HOOK_TITLE_LEFT = "55%";
const HOOK_TITLE_RIGHT = "6%";
const walkFrames = (count: number) => count * SLOT_FRAMES;

// Carousel sits at left=50% — the map spans the left 75%, the bg zone the right 25%.
const STACK_LEFT = 0.5;

export const ReelComposition: React.FC<{ slug: string }> = ({ slug }) => {
  const cfg = useStaticJson<ReelConfig>(`data/${slug}/reel.json`, "load reel.json");
  const buildings = cfg?.buildings ?? [];
  const count = buildings.length;

  if (!cfg) return null;

  return (
    <AbsoluteFill data-theme="dark" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      <MapProvider count={count}>
        <CameraSeries buildings={buildings} worldVP={WORLD_VP} />

        <Sequence from={0} durationInFrames={WALK_START + HOOK_EXIT_F} layout="none">
          <div style={{ position: "absolute", left: HOOK_TITLE_LEFT, right: HOOK_TITLE_RIGHT, top: 0, bottom: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <HookLockup architect={cfg.architect} subtitle={yearRange(cfg)} />
          </div>
        </Sequence>

        <Sequence from={WALK_START} durationInFrames={walkFrames(count)} layout="none">
          <WalkChrome buildings={buildings} slug={cfg.slug} title={reelTitle(cfg)} />
        </Sequence>

        <Sequence from={ctaStart(count)} durationInFrames={secToFrames(CTA_S)} layout="none">
          <CtaLockup />
        </Sequence>
      </MapProvider>
    </AbsoluteFill>
  );
};

/** WALK-local chrome: carousel, captions, brand. `chromeOpacity` fades in over
 *  slot-0's fly and out into CTA. */
const WalkChrome: React.FC<{
  buildings: ReelBuilding[];
  slug: string;
  title: string;
}> = ({ buildings, slug, title }) => {
  const frame = useCurrentFrame();
  const count = buildings.length;
  const walkLen = walkFrames(count);
  const lead = secToFrames(BRAND_FADE_OUT_LEAD_S);
  const CHROME_IN_S = 0.5;
  const fadeIn = interpolate(frame, [0, secToFrames(CHROME_IN_S)], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [walkLen - lead, walkLen], [0, 1], CLAMP);
  const chromeOpacity = fadeIn * (1 - fadeOut);

  return (
    <>
      <div style={{ position: "absolute", left: `${STACK_LEFT * 100}%`, right: 0, top: 0, bottom: 0, zIndex: 4, opacity: chromeOpacity }}>
        <CardCarousel slug={slug} buildings={buildings} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <Series>
          {buildings.map((b) => (
            <Series.Sequence key={b.slug} durationInFrames={SLOT_FRAMES} layout="none">
              <BuildingCaption building={b} opacity={chromeOpacity} />
            </Series.Sequence>
          ))}
        </Series>
      </div>
      <div style={{ position: "absolute", top: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
        <CornerBrand corner="top" title={title} opacity={chromeOpacity} />
      </div>
      <div style={{ position: "absolute", bottom: BRAND_VERT, right: BRAND_INSET, zIndex: 6 }}>
        <CornerBrand corner="bottom" opacity={chromeOpacity} />
      </div>
    </>
  );
};
