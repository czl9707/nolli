import { describe, it, expect } from "vitest";
import {
  FPS, HOOK_S, ESTABLISH_S, WALK_SLOT_S, CTA_S,
  HOOK_START, ESTABLISH_START, WALK_START, ctaStart, totalFrames,
  BEAT, getTimelineState,
} from "./timeline";

describe("timeline", () => {
  const COUNT = 9;
  it("derives frame boundaries from seconds constants", () => {
    expect(HOOK_START).toBe(0);
    expect(ESTABLISH_START).toBe(Math.round(HOOK_S * FPS));
    expect(WALK_START).toBe(Math.round((HOOK_S + ESTABLISH_S) * FPS));
    expect(ctaStart(COUNT)).toBe(WALK_START + Math.round(COUNT * WALK_SLOT_S * FPS));
    expect(totalFrames(COUNT)).toBe(ctaStart(COUNT) + Math.round(CTA_S * FPS));
  });
  it("scales total length with building count", () => {
    expect(totalFrames(5)).toBeLessThan(totalFrames(9));
    expect(totalFrames(9) - totalFrames(5)).toBe(Math.round(4 * WALK_SLOT_S * FPS));
  });
  it("maps frames to beats", () => {
    expect(getTimelineState(0, COUNT).beat).toBe(BEAT.HOOK);
    expect(getTimelineState(ESTABLISH_START, COUNT).beat).toBe(BEAT.ESTABLISH);
    expect(getTimelineState(WALK_START, COUNT).beat).toBe(BEAT.WALK);
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
