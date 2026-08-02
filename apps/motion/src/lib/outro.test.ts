import { describe, it, expect } from "vitest";
import { OUTRO, outroDuration, outroSegmentDurations, segmentDuration, visibleCharCount } from "./outro";

describe("visibleCharCount", () => {
  it("returns 0 before the start frame", () => {
    expect(visibleCharCount({ frame: 5, start: 6, charFrames: 3, length: 10 })).toBe(0);
  });
  it("reveals one char per charFrames", () => {
    expect(visibleCharCount({ frame: 6, start: 6, charFrames: 3, length: 10 })).toBe(1);
    expect(visibleCharCount({ frame: 8, start: 6, charFrames: 3, length: 10 })).toBe(1);
    expect(visibleCharCount({ frame: 9, start: 6, charFrames: 3, length: 10 })).toBe(2);
  });
  it("clamps to length", () => {
    expect(visibleCharCount({ frame: 999, start: 6, charFrames: 3, length: 5 })).toBe(5);
  });
});

describe("segmentDuration", () => {
  it("is typeStart + (chars-1)*charFrames + hold", () => {
    // "SANAA" (5 chars), entrance at frame 8: 8 + 4*3 + 15
    expect(segmentDuration(5, 8)).toBe(8 + 4 * OUTRO.charFrames + OUTRO.hold);
  });
  it("still holds even with no text", () => {
    expect(segmentDuration(0, 8)).toBe(8 + OUTRO.hold);
  });
});

describe("outroDuration", () => {
  it("is the sum of the four derived segment durations", () => {
    const manifest = { architect: "SANAA", count: 9 };
    const d = outroSegmentDurations(manifest);
    expect(outroDuration(manifest)).toBe(d.name + d.count + d.now + d.logo);
  });
  it("grows when the architect name is longer", () => {
    const short = outroDuration({ architect: "SANAA", count: 9 });
    const long = outroDuration({ architect: "Tadao Ando", count: 9 });
    expect(long).toBeGreaterThan(short);
  });
});
