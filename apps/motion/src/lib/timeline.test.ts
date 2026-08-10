import { describe, it, expect } from "vitest";
import {
  FPS, WALK_SLOT_S, CTA_S,
  WALK_START, ctaStart, totalFrames,
  BEAT, getTimelineState,
} from "./timeline";

describe("timeline", () => {
  const COUNT = 9;
  it("opens on WALK at frame 0 (motion-first; no HOOK/ESTABLISH beat)", () => {
    expect(WALK_START).toBe(0);
    expect(getTimelineState(0, COUNT).beat).toBe(BEAT.WALK);
  });
  it("derives CTA + total from the WALK length", () => {
    expect(ctaStart(COUNT)).toBe(Math.round(COUNT * WALK_SLOT_S * FPS));
    expect(totalFrames(COUNT)).toBe(ctaStart(COUNT) + Math.round(CTA_S * FPS));
  });
  it("scales total length with building count", () => {
    expect(totalFrames(5)).toBeLessThan(totalFrames(9));
    expect(totalFrames(9) - totalFrames(5)).toBe(Math.round(4 * WALK_SLOT_S * FPS));
  });
  it("maps frames to beats", () => {
    expect(getTimelineState(0, COUNT).beat).toBe(BEAT.WALK);
    expect(getTimelineState(ctaStart(COUNT), COUNT).beat).toBe(BEAT.CTA);
  });
  it("indexes buildings across WALK", () => {
    const walkLen = ctaStart(COUNT) - WALK_START;
    const mid = getTimelineState(WALK_START + Math.floor(walkLen / 2), COUNT);
    expect(mid.beat).toBe(BEAT.WALK);
    expect(mid.currentIndex).toBeGreaterThanOrEqual(0);
    expect(mid.currentIndex).toBeLessThan(COUNT);
    expect(mid.intra).toBeGreaterThanOrEqual(0);
    expect(mid.intra).toBeLessThanOrEqual(1);
  });
  it("clamps the final WALK frame to the last building", () => {
    const last = getTimelineState(ctaStart(COUNT) - 1, COUNT);
    expect(last.currentIndex).toBe(COUNT - 1);
  });
});
