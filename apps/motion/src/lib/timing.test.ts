import { describe, it, expect } from "vitest";
import { scene2Duration, scene2Frames, totalDuration } from "./timing";

describe("scene2Frames", () => {
  it("falls back to scene2Duration (150) when undefined", () => {
    expect(scene2Frames(undefined)).toBe(scene2Duration);
    expect(scene2Frames(undefined)).toBe(150);
  });

  it("uses the provided frame count when given", () => {
    expect(scene2Frames(375)).toBe(375);
  });
});

describe("totalDuration with variable morph", () => {
  const base = { architect: "Mies", count: 12 };

  it("adds mapClipFrames on top of the no-morph baseline when a morph is present", () => {
    const noMorph = totalDuration(10, false, { ...base, mapClipFrames: 375 });
    const withMorph = totalDuration(10, true, { ...base, mapClipFrames: 375 });
    expect(withMorph - noMorph).toBe(375);
  });

  it("falls back to scene2Duration when mapClipFrames is undefined", () => {
    const withMorph = totalDuration(10, true, base);
    const noMorph = totalDuration(10, false, base);
    expect(withMorph - noMorph).toBe(scene2Duration);
  });

  it("ignores mapClipFrames when there is no morph", () => {
    const withFrames = totalDuration(10, false, { ...base, mapClipFrames: 375 });
    const without = totalDuration(10, false, base);
    expect(withFrames).toBe(without);
  });
});
