import { describe, it, expect } from "vitest";
import { getTimelineState, TOTAL_FRAMES, BEAT } from "./timeline";

describe("getTimelineState", () => {
  it("hook beat maps to the hook building index", () => {
    const s = getTimelineState(0, 5, 0); // frame, count, hookIndex
    expect(s.beat).toBe(BEAT.HOOK);
    expect(s.currentIndex).toBe(0);
  });

  it("walk beat advances currentIndex across its window", () => {
    const count = 4;
    const mid = BEAT.WALK_START + Math.floor((BEAT.WALK_END - BEAT.WALK_START) / 2);
    const sStart = getTimelineState(BEAT.WALK_START, count, 0);
    const sMid = getTimelineState(mid, count, 0);
    const sEnd = getTimelineState(BEAT.WALK_END - 1, count, 0);
    expect(sStart.beat).toBe(BEAT.WALK);
    expect(sStart.currentIndex).toBe(0);
    expect(sEnd.currentIndex).toBe(count - 1);
    expect(sMid.currentIndex).toBeGreaterThan(sStart.currentIndex);
    expect(sMid.currentIndex).toBeLessThan(sEnd.currentIndex);
  });

  it("whole beat clamps to last building", () => {
    const s = getTimelineState(BEAT.WHOLE_START, 4, 0);
    expect(s.beat).toBe(BEAT.WHOLE);
    expect(s.currentIndex).toBe(3);
  });

  it("returns intra-building progress in [0,1) during the walk", () => {
    const s = getTimelineState(BEAT.WALK_START, 4, 0);
    expect(s.intra).toBeGreaterThanOrEqual(0);
    expect(s.intra).toBeLessThanOrEqual(1);
  });
});
