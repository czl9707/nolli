import { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NO_ANIM, SoftBlurIn } from "@nolli/remotion";
import { REEL_TYPE } from "../lib/type";
import { hookLead, heroImagePath, type ReelBuilding } from "../lib/config";
import { CLAMP, HOOK_EXIT_FRAMES, HOOK_FRAMES, REEL_W, REEL_H } from "../lib/timeline";

// --- Marquee geometry + math. Pure: no React/Remotion side effects. ---

export const ROW_H = Math.round(REEL_H * 0.3); // rows 30% each, title band the rest
export const HOOK_IMG_W = 480;
export const HOOK_GAP = 24;
export const HOOK_PITCH = HOOK_IMG_W + HOOK_GAP;
// Unequal speeds so the two rows parallax.
export const TOP_SPEED = 6;
export const BOTTOM_SPEED = 4.5;

export function splitRows<T>(items: T[]): [T[], T[]] {
  const top: T[] = [];
  const bottom: T[] = [];
  items.forEach((item, i) => (i % 2 === 0 ? top : bottom).push(item));
  return [top, bottom];
}

/** Plain cyclic repetition — the strip must be periodic with the row's period
 *  so the `marqueeShift` wrap lands on identical content. */
export function tileRow<T>(row: T[], cycles: number): T[] {
  if (row.length === 0) return [];
  return Array.from({ length: Math.max(1, cycles) * row.length }, (_, i) => row[i % row.length]);
}

/** Whole row-cycles needed: worst-case shift is one full period back, and the
 *  strip must still cover the viewport. */
export function stripCycles(rowLen: number): number {
  const period = rowLen * HOOK_PITCH;
  return 1 + Math.ceil((REEL_W + HOOK_GAP) / period);
}

/** Wrapped strip offset, always within [-period, 0]; seamless with a
 *  row-periodic strip. Positive speed scrolls leftward. */
export function marqueeShift(frame: number, period: number, speed: number): number {
  const mod = (((frame * speed) % period) + period) % period;
  return mod === 0 ? 0 : -mod; // avoid -0
}

const EXIT_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Exit state over the beat's final `exitFrames`: `move` is the px magnitude a
 *  row slides toward its own edge (0 → ROW_H, eased), `opacity` the row fade.
 *  Fade ends two frames early so no ghost rides the last frames before the cut. */
export function hookExit(
  frame: number,
  totalFrames: number,
  exitFrames: number,
): { move: number; opacity: number } {
  const begin = totalFrames - exitFrames;
  return {
    move: interpolate(frame, [begin, totalFrames], [0, ROW_H], {
      ...CLAMP,
      easing: EXIT_EASE,
    }),
    opacity: interpolate(frame, [begin, totalFrames - 2], [1, 0], CLAMP),
  };
}

const NAME_GAP = 24;

/** One scrolling strip of cover photos. Clipping lives on the outer fixed div,
 *  NOT the translated strip — else the visible window scrolls away with it. */
const MarqueeRow: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  shift: number;
  edge: "top" | "bottom";
  exitY: number;
  opacity: number;
}> = ({ slug, buildings, shift, edge, exitY, opacity }) => {
  const strip = useMemo(
    () =>
      buildings.map((b, i) => (
        <Img
          key={i}
          src={staticFile(heroImagePath(slug, b.slug))}
          style={{ width: HOOK_IMG_W, height: ROW_H, objectFit: "cover", flex: "none" }}
        />
      )),
    [buildings, slug],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [edge]: 0,
        height: ROW_H,
        overflow: "hidden",
        opacity,
        transform: `translateY(${exitY}px)`,
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
        {strip}
      </div>
    </div>
  );
};

/** HOOK beat — counter-scrolling cover rows flanking the architect title.
 *  Opaque background covers the map until the hard cut into the WALK flight. */
export const HookMarquee: React.FC<{
  slug: string;
  architect: string;
  buildings: ReelBuilding[];
}> = ({ slug, architect, buildings }) => {
  const frame = useCurrentFrame();
  const [top, bottom, topPeriod, bottomPeriod] = useMemo(() => {
    const [a, b] = splitRows(buildings);
    return [
      tileRow(a, stripCycles(a.length)),
      tileRow(b, stripCycles(b.length)),
      a.length * HOOK_PITCH,
      b.length * HOOK_PITCH,
    ];
  }, [buildings]);
  const FG = "rgb(var(--color-primary-foreground))";
  const { move, opacity } = hookExit(frame, HOOK_FRAMES, HOOK_EXIT_FRAMES);
  const exit = { when: HOOK_FRAMES - HOOK_EXIT_FRAMES, last: HOOK_FRAMES - 1, enabled: true };

  // Title settled from frame 0 — the feed poster frame must carry it.
  const lines = [
    { text: hookLead, role: REEL_TYPE.hookYears, marginTop: 0 },
    { text: architect, role: REEL_TYPE.hookName, marginTop: NAME_GAP },
  ];

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
          exitY={-move}
          opacity={opacity}
        />
        <MarqueeRow
          slug={slug}
          buildings={bottom}
          shift={marqueeShift(frame, bottomPeriod, -BOTTOM_SPEED)}
          edge="bottom"
          exitY={move}
          opacity={opacity}
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
          {lines.map(({ text, role, marginTop }) => (
            <SoftBlurIn
              key={text}
              text={text}
              start={NO_ANIM}
              end={exit}
              style={{
                display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
                ...role, marginTop,
              }}
            />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>
    </>
  );
};
