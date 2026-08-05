import { describe, it, expect } from "vitest";
import { OUTRO, segmentDuration, visibleCharCount } from "./outro";

describe("visibleCharCount", () => {
  it("returns 0 before the start frame", () => {
    expect(visibleCharCount({ frame: 5, start: 6, typeFrames: OUTRO.typeFrames, length: 10 })).toBe(0);
  });
  it("reveals one char at the start frame", () => {
    expect(visibleCharCount({ frame: 6, start: 6, typeFrames: OUTRO.typeFrames, length: 10 })).toBe(1);
  });
  it("reveals all chars by start + typeFrames", () => {
    expect(
      visibleCharCount({ frame: 6 + OUTRO.typeFrames, start: 6, typeFrames: OUTRO.typeFrames, length: 10 }),
    ).toBe(10);
  });
  it("clamps to length past the end", () => {
    expect(visibleCharCount({ frame: 999, start: 6, typeFrames: OUTRO.typeFrames, length: 5 })).toBe(5);
  });
  it("reveals all chars immediately when typeFrames is 0", () => {
    expect(visibleCharCount({ frame: 6, start: 6, typeFrames: 0, length: 10 })).toBe(10);
  });
});

describe("segmentDuration", () => {
  it("is typeStart + typeFrames + hold for any non-empty text", () => {
    expect(segmentDuration(5, 8)).toBe(8 + OUTRO.typeFrames + OUTRO.hold);
    expect(segmentDuration(50, 8)).toBe(8 + OUTRO.typeFrames + OUTRO.hold);
  });
  it("still holds even with no text (no typing window)", () => {
    expect(segmentDuration(0, 8)).toBe(8 + OUTRO.hold);
  });
});
