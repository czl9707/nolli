import { useMemo } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SoftBlurIn } from "./SoftBlurIn";
import { REEL_TYPE } from "../lib/type";
import type { ReelBuilding } from "../lib/config";

// --- Marquee geometry + math (1920×1080). Pure: no React/Remotion side effects. ---

/** Row height — 30% of the 1080px canvas; the title band gets the rest. */
export const ROW_H = 324;
export const HOOK_IMG_W = 480;
export const HOOK_GAP = 24;
export const HOOK_PITCH = HOOK_IMG_W + HOOK_GAP;
/** Scroll speeds in px/frame — deliberately unequal so the rows parallax. */
export const TOP_SPEED = 6;
export const BOTTOM_SPEED = 4.5;

/** Even indices -> top row, odd -> bottom, order preserved. */
export function splitRows<T>(items: T[]): [T[], T[]] {
  const top: T[] = [];
  const bottom: T[] = [];
  items.forEach((item, i) => (i % 2 === 0 ? top : bottom).push(item));
  return [top, bottom];
}

/** Repeat `row` cyclically until it holds at least `minCount` whole-row cycles'
 *  worth of items (result length is a multiple of the row length). Plain
 *  repetition — the strip must be periodic with the row's period so the
 *  `marqueeShift` wrap lands on identical content. */
export function tileRow<T>(row: T[], minCount: number): T[] {
  if (row.length === 0) return [];
  const cycles = Math.max(1, Math.ceil(minCount / row.length));
  return Array.from({ length: cycles * row.length }, (_, i) => row[i % row.length]);
}

/** How many whole row-cycles the strip needs: worst-case shift is one full row
 *  period back, and the strip must still cover the 1920px viewport. */
export function stripCycles(rowLen: number): number {
  const period = rowLen * HOOK_PITCH;
  return 1 + Math.ceil((1920 + HOOK_GAP) / period);
}

/** Wrapped strip offset for frame `frame` at `speed` px/frame. Always within
 *  [-period, 0]; with a row-periodic strip the wrap is seamless (identical
 *  content one period over). Positive speed scrolls leftward, negative
 *  rightward. */
export function marqueeShift(frame: number, period: number, speed: number): number {
  const mod = (((frame * speed) % period) + period) % period;
  return mod === 0 ? 0 : -mod; // avoid -0
}

// --- Component ---

const NAME_GAP = 24;
const HOOK_LEAD = "Architecture by";
// Settled from frame 0 — the feed poster frame must carry the title; the
// scrolling rows supply all the motion this beat needs.
const SETTLED = { when: 0, last: 0, enabled: false } as const;

/** One scrolling strip of cover photos. The outer div is the fixed clip
 *  viewport; the inner div is the translated strip (clipping must NOT ride
 *  along with the transform, or the visible window scrolls away with it). */
const MarqueeRow: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  shift: number;
  edge: "top" | "bottom";
}> = ({ slug, buildings, shift, edge }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      [edge]: 0,
      height: ROW_H,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        gap: HOOK_GAP,
        width: "max-content",
        height: "100%",
        transform: `translateX(${shift}px)`,
      }}
    >
      {buildings.map((b, i) => (
        <Img
          key={i}
          src={staticFile(`data/${slug}/images/${b.slug}-hero.jpg`)}
          style={{ width: HOOK_IMG_W, height: ROW_H, objectFit: "cover", flex: "none" }}
        />
      ))}
    </div>
  </div>
);

/** HOOK beat — counter-scrolling cover rows flanking the architect title. The
 *  opaque background covers the map until the hard cut into the WALK flight. */
export const HookMarquee: React.FC<{
  slug: string;
  architect: string;
  buildings: ReelBuilding[];
}> = ({ slug, architect, buildings }) => {
  const frame = useCurrentFrame();
  const [top, bottom, topPeriod, bottomPeriod] = useMemo(() => {
    const [a, b] = splitRows(buildings);
    return [
      tileRow(a, stripCycles(a.length) * a.length),
      tileRow(b, stripCycles(b.length) * b.length),
      a.length * HOOK_PITCH,
      b.length * HOOK_PITCH,
    ];
  }, [buildings]);
  const FG = "rgb(var(--color-primary-foreground))";

  return (
    <>
      <AbsoluteFill
        style={{ backgroundColor: "rgb(var(--color-primary-background))", zIndex: 4 }}
      />
      <AbsoluteFill style={{ zIndex: 5 }}>
        <MarqueeRow
          slug={slug}
          buildings={top}
          shift={marqueeShift(frame, topPeriod, TOP_SPEED)}
          edge="top"
        />
        <MarqueeRow
          slug={slug}
          buildings={bottom}
          shift={marqueeShift(frame, bottomPeriod, -BOTTOM_SPEED)}
          edge="bottom"
        />
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
          }}
        >
          <SoftBlurIn
            text={HOOK_LEAD}
            start={SETTLED}
            end={SETTLED}
            style={{
              display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
              ...REEL_TYPE.hookYears,
            }}
          />
          <SoftBlurIn
            text={architect}
            start={SETTLED}
            end={SETTLED}
            style={{
              display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
              ...REEL_TYPE.hookName, marginTop: NAME_GAP,
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </>
  );
};
