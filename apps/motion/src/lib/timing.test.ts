import { describe, it, expect } from "vitest";
import { scene2Duration, scene2Frames, totalDuration, MORPH_PLAYBACK_RATE } from "./timing";

describe("scene2Frames", () => {
  it("falls back to scene2Duration / rate (75) when undefined", () => {
    expect(scene2Frames(undefined)).toBe(Math.ceil(scene2Duration / MORPH_PLAYBACK_RATE));
    expect(scene2Frames(undefined)).toBe(75);
  });

  it("divides the provided frame count by the playback rate", () => {
    expect(scene2Frames(375)).toBe(Math.ceil(375 / MORPH_PLAYBACK_RATE));
  });
});

describe("totalDuration with variable morph", () => {
  const base = { architect: "Mies", count: 12 };

  it("adds mapClipFrames / rate on top of the no-morph baseline when a morph is present", () => {
    const noMorph = totalDuration(10, false, { ...base, mapClipFrames: 375 });
    const withMorph = totalDuration(10, true, { ...base, mapClipFrames: 375 });
    expect(withMorph - noMorph).toBe(Math.ceil(375 / MORPH_PLAYBACK_RATE));
  });

  it("falls back to scene2Duration / rate when mapClipFrames is undefined", () => {
    const withMorph = totalDuration(10, true, base);
    const noMorph = totalDuration(10, false, base);
    expect(withMorph - noMorph).toBe(Math.ceil(scene2Duration / MORPH_PLAYBACK_RATE));
  });

  it("ignores mapClipFrames when there is no morph", () => {
    const withFrames = totalDuration(10, false, { ...base, mapClipFrames: 375 });
    const without = totalDuration(10, false, base);
    expect(withFrames).toBe(without);
  });
});
