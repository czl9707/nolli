import { describe, it, expect } from "vitest";
import {
  FPS, SLOT_FRAMES, CTA_S,
  HOOK_S, WALK_START, ctaStart, totalFrames,
  BEAT, getTimelineState,
} from "./timeline";

describe("timeline", () => {
  const COUNT = 9;
  it("opens on HOOK at frame 0, WALK after HOOK_S", () => {
    expect(WALK_START).toBe(Math.round(HOOK_S * FPS));
    expect(getTimelineState(0, COUNT).beat).toBe(BEAT.HOOK);
    expect(getTimelineState(WALK_START, COUNT).beat).toBe(BEAT.WALK);
  });
  it("HOOK resolves to building 0 with no intra progress", () => {
    const h = getTimelineState(Math.floor(WALK_START / 2), COUNT);
    expect(h.beat).toBe(BEAT.HOOK);
    expect(h.currentIndex).toBe(0);
    expect(h.intra).toBe(0);
  });
  it("derives CTA + total from the HOOK + WALK length", () => {
    expect(ctaStart(COUNT)).toBe(WALK_START + COUNT * SLOT_FRAMES);
    expect(totalFrames(COUNT)).toBe(ctaStart(COUNT) + Math.round(CTA_S * FPS));
  });
  it("scales total length with building count", () => {
    expect(totalFrames(5)).toBeLessThan(totalFrames(9));
    expect(totalFrames(9) - totalFrames(5)).toBe(4 * SLOT_FRAMES);
  });
  it("maps frames to beats", () => {
    expect(getTimelineState(0, COUNT).beat).toBe(BEAT.HOOK);
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
