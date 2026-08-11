import { describe, it, expect } from "vitest";
import { getReelVisuals } from "./reel-visuals";
import { BEAT, WALK_START, WALK_SLOT_S, FLY_FRAC, SNAP_S, ctaStart, secToFrames } from "./timeline";

const COUNT = 9;

describe("getReelVisuals", () => {
  it("opens on HOOK at frame 0: map full, chrome off, hookTitle on", () => {
    const f = getReelVisuals(0, COUNT);
    expect(f.beat).toBe(BEAT.HOOK);
    expect(f.mapOpacity).toBe(1);      // map is the static stage, full from frame 0
    expect(f.chromeOpacity).toBe(0);   // carousel/caption/brand hidden during HOOK
    expect(f.hookTitle).toBe(true);
    expect(f.cameraMoving).toBe(false);
  });

  it("chrome reaches full opacity after the slot-0 fade-in", () => {
    const f = getReelVisuals(WALK_START + secToFrames(0.5), COUNT);
    expect(f.chromeOpacity).toBeCloseTo(1, 5);
    expect(f.mapOpacity).toBe(1); // map did not dip at WALK_START
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
    // snap in progress at slot start (not yet centered). Exact start position
    // depends on SNAP_EASE, so only assert it's strictly mid-slide.
    expect(entering.carouselPos).toBeGreaterThanOrEqual(1);
    expect(entering.carouselPos).toBeLessThan(2);

    const snapped = getReelVisuals(slotStart + secToFrames(SNAP_S), COUNT);
    expect(snapped.carouselPos).toBeCloseTo(2, 5); // 0.5s snap done → centered

    // ease-out is front-loaded: at half the snap window the card is past halfway
    // (carouselPos > 1.5) for any ease-out exponent ≥ 1.
    const midSnap = getReelVisuals(slotStart + Math.round(secToFrames(SNAP_S) / 2), COUNT);
    expect(midSnap.carouselPos).toBeGreaterThan(1.5);
    expect(midSnap.carouselPos).toBeLessThan(2);
  });

  it("cameraMoving is true only during a slot's fly-in, settled everywhere else", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const at = (intra: number) => WALK_START + Math.round(intra * slotFrames);
    expect(getReelVisuals(at(FLY_FRAC / 2), COUNT).cameraMoving).toBe(true);
    expect(getReelVisuals(at((FLY_FRAC + 1) / 2), COUNT).cameraMoving).toBe(false);
    expect(getReelVisuals(ctaStart(COUNT), COUNT).cameraMoving).toBe(false);
  });

  it("hookTitle is on through HOOK + slot-0 fly, then off", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const at = (intra: number) => WALK_START + Math.round(intra * slotFrames);
    expect(getReelVisuals(0, COUNT).hookTitle).toBe(true);                    // HOOK
    expect(getReelVisuals(at(FLY_FRAC / 2), COUNT).hookTitle).toBe(true);     // slot-0 fly
    expect(getReelVisuals(at(FLY_FRAC + 0.01), COUNT).hookTitle).toBe(false); // past fly
    expect(getReelVisuals(at(1.5), COUNT).hookTitle).toBe(false);             // mid slot 1
  });
});
