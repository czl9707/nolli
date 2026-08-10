import { describe, it, expect } from "vitest";
import { getReelVisuals } from "./reel-visuals";
import { BEAT, WALK_START, WALK_SLOT_S, FLY_FRAC, SNAP_S, ctaStart, secToFrames } from "./timeline";

const COUNT = 9;

describe("getReelVisuals", () => {
  it("opens on WALK at frame 0 with chrome fading in", () => {
    const f = getReelVisuals(0, COUNT);
    expect(f.beat).toBe(BEAT.WALK);
    expect(f.chromeOpacity).toBe(0); // soft-fade-in just starting at the open
  });

  it("chrome reaches full opacity after the open fade-in", () => {
    const f = getReelVisuals(secToFrames(0.5), COUNT);
    expect(f.chromeOpacity).toBeCloseTo(1, 5);
  });

  it("CTA: ctaFrame is zero at the boundary, chrome faded out", () => {
    const cta = ctaStart(COUNT);
    const f = getReelVisuals(cta, COUNT);
    expect(f.beat).toBe(BEAT.CTA);
    expect(f.ctaFrame).toBe(0);
    expect(f.chromeOpacity).toBe(0);
  });

  it("carousel snaps into center over SNAP_S with ease-out, then holds", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const slotStart = WALK_START + 2 * slotFrames; // entering building index 2
    const entering = getReelVisuals(slotStart, COUNT);
    expect(entering.currentIndex).toBe(2);
    // snap just begun → still on the previous card (tolerant of slot-boundary frame jitter)
    expect(entering.carouselPos).toBeGreaterThanOrEqual(1);
    expect(entering.carouselPos).toBeLessThan(1.2);

    const snapped = getReelVisuals(slotStart + secToFrames(SNAP_S), COUNT);
    expect(snapped.carouselPos).toBeCloseTo(2, 5); // 0.5s snap done → centered

    // ease-out: at half the snap window the card is already most of the way to center.
    const midSnap = getReelVisuals(slotStart + Math.round(secToFrames(SNAP_S) / 2), COUNT);
    expect(midSnap.carouselPos).toBeGreaterThan(1.7);
    expect(midSnap.carouselPos).toBeLessThan(2);
  });

  it("cameraMoving is true only during a slot's fly-in, settled everywhere else", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const at = (intra: number) => WALK_START + Math.round(intra * slotFrames);
    expect(getReelVisuals(at(FLY_FRAC / 2), COUNT).cameraMoving).toBe(true);
    expect(getReelVisuals(at((FLY_FRAC + 1) / 2), COUNT).cameraMoving).toBe(false);
    expect(getReelVisuals(ctaStart(COUNT), COUNT).cameraMoving).toBe(false);
  });
});
