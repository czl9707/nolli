import { describe, it, expect } from "vitest";
import { OUTRO, outroDuration, visibleCharCount } from "./outro";

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

describe("outroDuration", () => {
  it("is the sum of the four segment durations", () => {
    expect(outroDuration).toBe(
      OUTRO.segments.name + OUTRO.segments.count + OUTRO.segments.now + OUTRO.segments.logo,
    );
  });
});
