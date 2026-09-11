// apps/video-gen/src/components/grid/PosterList.tsx
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { NO_ANIM, SoftBlurIn } from "@nolli/remotion";
import { CLAMP, OPEN_FRAMES, SLOT_FRAMES, openExitEnd, landFrame, secToFrames } from "@/lib/timeline";
import { REEL_TYPE, ACCENT } from "@/lib/type";
import type { ReelBuilding } from "@/lib/config";

const FG = "rgb(var(--color-primary-foreground))";

export const ROW_STRIDE = 34;
const ROW_H = 26;
const SLIDE_F = secToFrames(0.3);
const NAME_BLUR_F = 16;

/** Rows landed during the opening thumbnail: the first `capacity` (or all,
 *  if fewer), easing back to the dim-number state over the opening exit so
 *  the walk can re-stamp them. Pure. */
export function openingRows(frame: number, count: number, capacity: number): number {
  if (frame >= openExitEnd()) return 0;
  return Math.min(count, capacity);
}

/** Rows the window must slide up: 0 until the (capacity+1)-th stamp lands,
 *  then one stride per further landing — eased over SLIDE_F, capped at the
 *  last row. Same anchoring rule as the old ledgerShift: the stride starts at
 *  ITS OWN landing. */
export function listShift(frame: number, count: number, capacity: number): number {
  const maxShift = Math.max(0, count - capacity);
  if (maxShift === 0) return 0;
  const firstSlideLand = landFrame(capacity);
  if (frame < firstSlideLand) return 0;
  const step = Math.min(maxShift, 1 + Math.floor((frame - firstSlideLand) / SLOT_FRAMES));
  const stepLand = landFrame(capacity - 1 + step);
  const e = interpolate(frame, [stepLand, stepLand + SLIDE_F], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  return (1 - step - e) * ROW_STRIDE;
}

/** Single-column index of works: dim number slots from frame 0; on each
 *  landing the name soft-blur in (accent), dims to foreground on the next
 *  landing. Slides up one row per slot once the window is full. */
export const PosterList: React.FC<{ buildings: ReelBuilding[]; width: number; capacity: number }> = ({ buildings, width, capacity }) => {
  const frame = useCurrentFrame();
  const openN = openingRows(frame, buildings.length, capacity);
  const openFade = interpolate(frame, [OPEN_FRAMES, openExitEnd()], [1, 0], CLAMP);
  return (
    <div style={{ width, height: capacity * ROW_STRIDE, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: ROW_STRIDE - ROW_H, alignItems: "flex-start", transform: `translateY(${listShift(frame, buildings.length, capacity)}px)` }}>
        {buildings.map((b, i) => {
          const landF = landFrame(i);
          const landed = frame >= landF;
          const openingLanded = i < openN;
          const active = landed && (i === buildings.length - 1 || frame < landFrame(i + 1));
          const num = String(i + 1).padStart(2, "0");
          return (
            <div key={b.slug} style={{ display: "flex", alignItems: "baseline", gap: 14, height: ROW_H, width: "100%" }}>
              <span style={{ ...REEL_TYPE.posterRowNum, color: active ? ACCENT : FG, opacity: landed || openingLanded ? 1 : 0.4, width: 34, flex: "0 0 auto" }}>
                {num}
              </span>
              {landed || openingLanded ? (
                <span
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    opacity: active ? 1 : 0.8,
                    // Fixed-width wrapper keeps the mask past the text end:
                    // only names long enough to reach it fade.
                    maskImage: "linear-gradient(to right, black calc(100% - 16px), transparent)",
                    WebkitMaskImage: "linear-gradient(to right, black calc(100% - 16px), transparent)",
                  }}
                >
                  {landed ? (
                    <SoftBlurIn
                      text={b.name}
                      start={{ when: landF, last: landF + NAME_BLUR_F, enabled: true }}
                      end={NO_ANIM}
                      style={{ ...REEL_TYPE.posterRowName, color: active ? ACCENT : FG }}
                    />
                  ) : (
                    <span style={{ ...REEL_TYPE.posterRowName, color: FG, opacity: openFade }}>{b.name}</span>
                  )}
                </span>
              ) : (
                <span style={{ flex: "1 1 0" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
