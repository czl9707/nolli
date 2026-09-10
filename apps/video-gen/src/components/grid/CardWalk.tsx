// apps/video-gen/src/components/grid/CardWalk.tsx
import { useMemo } from "react";
import { interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { CLAMP, FPS, landFrame } from "@/lib/timeline";
import { heroImagePath, type ReelBuilding } from "@/lib/config";
import { projectToWindow, type MapViewport } from "@/lib/viewport";
import { PaperCard } from "@/components/PaperCard";

/** Drop-in spring length (frames). */
export const DROP_F = 16;
/** Lift-out length (frames); the outgoing pin overlaps the next drop-in. */
export const LIFT_F = 11;

/** Absolute frame window a pin is on the map: [landing, next landing + LIFT_F).
 *  The last pin never exits. */
export function pinWindow(i: number, count: number): [number, number] {
  const start = landFrame(i);
  const end = i === count - 1 ? Number.MAX_SAFE_INTEGER : landFrame(i + 1) + LIFT_F;
  return [start, end];
}

/** One pin's animation state: spring drop-in (scale 0.6→1), quick fade-up,
 *  then lift-out at the next boundary (recedes to 0.92× while fading). Pure. */
export function pinAnim(frame: number, i: number, count: number): { scale: number; opacity: number } {
  const [start, end] = pinWindow(i, count);
  if (frame < start || frame >= end) return { scale: 1, opacity: 0 };
  const entry = spring({ frame: frame - start, fps: FPS, config: { stiffness: 260, damping: 18 } });
  const scale = 0.6 + 0.4 * entry;
  const opacity = Math.min(1, (frame - start) / 6);
  if (end === Number.MAX_SAFE_INTEGER) return { scale, opacity };
  const lift = interpolate(frame, [end - LIFT_F, end], [0, 1], CLAMP);
  return { scale: scale * (1 - 0.08 * lift), opacity: opacity * (1 - lift) };
}

/** PaperCard footprint incl. its 8px paper padding — the anchored box. */
const CARD = { w: 360, h: 246 };

/** The one-pin walk: exactly one architecture card on the map at a time.
  *  Static camera → positions are computed once per building in pure
  *  mercator math (no map instance, no markers) and rendered as a plain
  *  overlay above the pane hairlines — a card may cross a hairline, but
  *  nothing ever crops it. */
export const CardWalk: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  vp: MapViewport;
  /** Map-pane rect in poster px; projected points are offset by its origin. */
  plate: { left: number; top: number; width: number; height: number };
}> = ({ slug, buildings, vp, plate }) => {
  const frame = useCurrentFrame();
  const spots = useMemo(
    () =>
      buildings.map((b) => {
        const [x, y] = projectToWindow(b.coordinates.lng, b.coordinates.lat, vp, plate.width, plate.height);
        return { b, px: plate.left + x, py: plate.top + y };
      }),
    [buildings, vp, plate],
  );
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
      {spots.map(({ b, px, py }, i) => {
        const { scale, opacity } = pinAnim(frame, i, buildings.length);
        if (opacity <= 0) return null;
        return (
          <div key={b.slug} style={{ position: "absolute", left: px - CARD.w / 2, top: py - CARD.h / 2, width: CARD.w, height: CARD.h, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `scale(${scale})`, opacity, transformOrigin: "center" }}>
              <PaperCard src={staticFile(heroImagePath(slug, b.slug))} alt={b.name} width={344} height={230} seed={b.slug} tilt={28} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
