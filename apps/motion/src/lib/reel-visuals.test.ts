import { describe, it, expect } from "vitest";
import { getReelVisuals, type ReelGeometry } from "./reel-visuals";
import { BEAT, WALK_START, WALK_SLOT_S, FLY_FRAC, SLOT_FADE_FRAC, ctaStart, secToFrames } from "./timeline";

const COUNT = 9;
const GEO: ReelGeometry = { PAD: 72, TL_W: 864, TIMELINE_H: 152, PANEL_W: 1920, PANEL_H: 1080 };

describe("getReelVisuals", () => {
  it("opens on WALK at frame 0: grid visible, timeline in the corner, chrome fading in", () => {
    const f = getReelVisuals(0, COUNT, GEO);
    expect(f.beat).toBe(BEAT.WALK);
    expect(f.showGrid).toBe(true);
    expect(f.gridOpacity).toBe(1);
    expect(f.tlScale).toBe(1); // no center→corner slide anymore
    expect(f.tlLeft).toBe(GEO.PAD);
    expect(f.tlTop).toBe(GEO.PANEL_H - GEO.PAD - GEO.TIMELINE_H);
    expect(f.tlOpacity).toBe(0); // soft-fade-in just starting at the open
  });

  it("chrome reaches full opacity after the open fade-in", () => {
    const f = getReelVisuals(secToFrames(0.5), COUNT, GEO);
    expect(f.tlOpacity).toBeCloseTo(1, 5);
  });

  it("CTA: ctaFrame is zero at the boundary, chrome + grid gone", () => {
    const cta = ctaStart(COUNT);
    const f = getReelVisuals(cta, COUNT, GEO);
    expect(f.beat).toBe(BEAT.CTA);
    expect(f.ctaFrame).toBe(0);
    expect(f.inWalkEra).toBe(false);
    expect(f.showGrid).toBe(false);
    expect(f.tlOpacity).toBe(0); // faded out into CTA
  });

  it("carousel rolls from the previous building into the current one, then holds", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const slotStart = WALK_START + 2 * slotFrames; // entering building index 2
    const entering = getReelVisuals(slotStart, COUNT, GEO);
    expect(entering.currentIndex).toBe(2);
    // At the slot boundary the roll has barely begun (tiny intra from frame
    // rounding at WALK_SLOT_S=2.5), so the carousel is still on the previous.
    expect(entering.carouselPos).toBeCloseTo(1, 1);

    const held = getReelVisuals(slotStart + secToFrames(WALK_SLOT_S / 2), COUNT, GEO);
    expect(held.carouselPos).toBeCloseTo(2, 5);
  });

  it("content slides in from the right then out to the left within a slot", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const slotStart = WALK_START + slotFrames; // building index 1
    const at = (intra: number) => slotStart + Math.round(intra * slotFrames);
    const fadeIn = getReelVisuals(at(SLOT_FADE_FRAC / 2), COUNT, GEO);
    const mid = getReelVisuals(at(0.5), COUNT, GEO);
    const fadeOut = getReelVisuals(at(1 - SLOT_FADE_FRAC / 2), COUNT, GEO);
    expect(fadeIn.contentX).toBeGreaterThan(0);
    expect(mid.contentX).toBe(0);
    expect(mid.contentOpacity).toBe(1);
    expect(fadeOut.contentX).toBeLessThan(0);
  });

  it("cameraMoving is true only during a slot's fly-in, settled everywhere else", () => {
    const slotFrames = secToFrames(WALK_SLOT_S);
    const at = (intra: number) => WALK_START + Math.round(intra * slotFrames);
    const flyMid = getReelVisuals(at(FLY_FRAC / 2), COUNT, GEO);
    expect(flyMid.cameraMoving).toBe(true);
    const held = getReelVisuals(at((FLY_FRAC + 1) / 2), COUNT, GEO);
    expect(held.cameraMoving).toBe(false);
    const cta = getReelVisuals(ctaStart(COUNT), COUNT, GEO);
    expect(cta.cameraMoving).toBe(false);
  });
});
