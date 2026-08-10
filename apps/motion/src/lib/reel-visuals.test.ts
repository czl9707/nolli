import { describe, it, expect } from "vitest";
import { getReelVisuals } from "./reel-visuals";
import { BEAT, WALK_START, WALK_SLOT_S, FLY_FRAC, ctaStart, secToFrames } from "./timeline";

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

  it("carousel couples to the fly: rolls previous→current over the fly, then holds", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const slotStart = WALK_START + 2 * slotFrames; // entering building index 2
    const entering = getReelVisuals(slotStart, COUNT);
    expect(entering.currentIndex).toBe(2);
    expect(entering.carouselPos).toBeCloseTo(1, 1); // roll just begun → still on previous

    const midFly = getReelVisuals(slotStart + Math.round((FLY_FRAC / 2) * slotFrames), COUNT);
    expect(midFly.carouselPos).toBeCloseTo(1.5, 1); // halfway through fly → halfway between 1 and 2

    const held = getReelVisuals(slotStart + Math.round(FLY_FRAC * slotFrames), COUNT);
    expect(held.carouselPos).toBeCloseTo(2, 1); // fly complete → centered on 2
  });

  it("cameraMoving is true only during a slot's fly-in, settled everywhere else", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const at = (intra: number) => WALK_START + Math.round(intra * slotFrames);
    expect(getReelVisuals(at(FLY_FRAC / 2), COUNT).cameraMoving).toBe(true);
    expect(getReelVisuals(at((FLY_FRAC + 1) / 2), COUNT).cameraMoving).toBe(false);
    expect(getReelVisuals(ctaStart(COUNT), COUNT).cameraMoving).toBe(false);
  });
});
