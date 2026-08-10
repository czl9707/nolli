import { describe, it, expect } from "vitest";
import { getReelVisuals, type ReelGeometry } from "./reel-visuals";
import { BEAT, ESTABLISH_START, WALK_START, ctaStart, secToFrames } from "./timeline";

const COUNT = 9;
const GEO: ReelGeometry = { PAD: 72, TL_W: 864, TIMELINE_H: 152, PANEL_W: 1920, PANEL_H: 1080 };

describe("getReelVisuals", () => {
  it("HOOK frame: no timeline layer, no grid", () => {
    const f = getReelVisuals(0, COUNT, GEO);
    expect(f.beat).toBe(BEAT.HOOK);
    expect(f.inWalkEra).toBe(false);
    expect(f.showGrid).toBe(false);
    expect(f.tlOpacity).toBe(0);
  });

  it("ESTABLISH: timeline layer present (inWalkEra), centered + enlarged, grid hidden", () => {
    const f = getReelVisuals(ESTABLISH_START + secToFrames(0.5), COUNT, GEO);
    expect(f.beat).toBe(BEAT.ESTABLISH);
    expect(f.inWalkEra).toBe(true);
    expect(f.showGrid).toBe(false); // grid only fades in over the final GRID_FADE_LEAD_S
    expect(f.gridOpacity).toBe(0);
    expect(f.tlScale).toBeCloseTo(1.12, 5); // pre-slide: still enlarged
    expect(f.tlLeft).toBeCloseTo((GEO.PANEL_W - GEO.TL_W) / 2, 5); // horizontally centered
  });

  it("WALK start: timeline tucked in the corner at scale 1, grid fully visible", () => {
    const f = getReelVisuals(WALK_START, COUNT, GEO);
    expect(f.beat).toBe(BEAT.WALK);
    expect(f.gridOpacity).toBe(1);
    expect(f.tlScale).toBe(1);
    expect(f.tlLeft).toBe(GEO.PAD);
    expect(f.tlTop).toBe(GEO.PANEL_H - GEO.PAD - GEO.TIMELINE_H);
  });

  it("CTA: ctaFrame is zero at the boundary, timeline layer gone", () => {
    const cta = ctaStart(COUNT);
    const f = getReelVisuals(cta, COUNT, GEO);
    expect(f.beat).toBe(BEAT.CTA);
    expect(f.ctaFrame).toBe(0);
    expect(f.inWalkEra).toBe(false);
  });

  it("carousel rolls from the previous building into the current one, then holds", () => {
    // Slot i begins at WALK_START + i * slotFrames; intra 0 = just entered.
    const slotFrames = secToFrames(5);
    const slotStart = WALK_START + 2 * slotFrames; // entering building index 2
    const entering = getReelVisuals(slotStart, COUNT, GEO);
    expect(entering.currentIndex).toBe(2);
    // At intra 0 the roll has just begun: carousel still on the previous (1).
    expect(entering.carouselPos).toBeCloseTo(1, 5);

    // Once intra passes ROLL_FRAC (0.2 of the slot) the roll finishes on current.
    const held = getReelVisuals(slotStart + secToFrames(2.5), COUNT, GEO);
    expect(held.carouselPos).toBeCloseTo(2, 5);
  });

  it("content slides in from the right then out to the left within a slot", () => {
    const slotFrames = secToFrames(5);
    const slotStart = WALK_START + slotFrames; // building index 1
    const fadeIn = getReelVisuals(slotStart + secToFrames(0.5), COUNT, GEO);
    const mid = getReelVisuals(slotStart + secToFrames(2.5), COUNT, GEO);
    const fadeOut = getReelVisuals(slotStart + secToFrames(4.5), COUNT, GEO);
    expect(fadeIn.contentX).toBeGreaterThan(0); // entering: offset right
    expect(mid.contentX).toBe(0); // held: centered
    expect(mid.contentOpacity).toBe(1);
    expect(fadeOut.contentX).toBeLessThan(0); // exiting: offset left
  });

  it("cameraMoving is true only during a slot's fly-in, settled everywhere else", () => {
    // WALK slot 0 fly = first 3s (WALK_FLY_S) of the slot; hold = the rest.
    const flyMid = getReelVisuals(WALK_START + secToFrames(1.5), COUNT, GEO);
    expect(flyMid.cameraMoving).toBe(true);
    // Once intra passes flyFrac the camera has settled on the building.
    const held = getReelVisuals(WALK_START + secToFrames(4), COUNT, GEO);
    expect(held.cameraMoving).toBe(false);
    // ESTABLISH (world hold) and CTA are settled too.
    const establish = getReelVisuals(ESTABLISH_START + secToFrames(1), COUNT, GEO);
    expect(establish.cameraMoving).toBe(false);
    const cta = getReelVisuals(ctaStart(COUNT), COUNT, GEO);
    expect(cta.cameraMoving).toBe(false);
  });
});
