import { describe, it, expect } from "vitest";
import {
  durationOf,
  totalDuration,
  segmentDuration,
  exitStartFrame,
  DEFAULT_TEXT_SIZE,
  DEFAULT_FONT_VARIANT,
} from "./scenes";
import { OUTRO, LOGO_WORD, STILL_FRAMES } from "./constants";

describe("segmentDuration", () => {
  it("is typeStart + typeFrames + hold for any non-empty text", () => {
    expect(segmentDuration(5, 8)).toBe(8 + OUTRO.typeFrames + OUTRO.hold);
    expect(segmentDuration(50, 8)).toBe(8 + OUTRO.typeFrames + OUTRO.hold);
  });
  it("still holds even with no text (no reveal window)", () => {
    expect(segmentDuration(0, 8)).toBe(8 + OUTRO.hold);
  });
  it("adds an exit wipe window when exit is true", () => {
    expect(segmentDuration(5, 8, true)).toBe(8 + OUTRO.typeFrames + OUTRO.hold + OUTRO.exitFrames);
  });
  it("exit start is entrance + reveal window + hold", () => {
    expect(exitStartFrame(8)).toBe(8 + OUTRO.typeFrames + OUTRO.hold);
  });
});

describe("durationOf", () => {
  it("text = segmentDuration(text.length, 0, exit=true)", () => {
    expect(durationOf({ type: "text", text: "Mies" })).toBe(segmentDuration(4, 0, true));
  });
  it("image = STILL_FRAMES", () => {
    expect(durationOf({ type: "image", src: "x.png" })).toBe(STILL_FRAMES);
  });
  it("video = ceil(frames / playbackRate)", () => {
    expect(durationOf({ type: "video", src: "m.mp4", frames: 300, playbackRate: 2 })).toBe(
      Math.ceil(300 / 2),
    );
  });
  it("video without an ffprobed frame count throws", () => {
    expect(() => durationOf({ type: "video", src: "m.mp4" })).toThrow(/assemble/);
  });
  it("logo = segmentDuration(LOGO_WORD, logo.typeStart)", () => {
    expect(durationOf({ type: "logo" })).toBe(
      segmentDuration(LOGO_WORD.length, OUTRO.logo.typeStart),
    );
  });
});

describe("totalDuration", () => {
  it("sums durationOf across scenes", () => {
    const scenes = [
      { type: "text", text: "A" },
      { type: "image", src: "x.png" },
      { type: "logo" },
    ] as const;
    expect(totalDuration(scenes)).toBe(
      durationOf(scenes[0]) + durationOf(scenes[1]) + durationOf(scenes[2]),
    );
  });
});

describe("defaults", () => {
  it("DEFAULT_TEXT_SIZE is 104", () => expect(DEFAULT_TEXT_SIZE).toBe(104));
  it("DEFAULT_FONT_VARIANT is playful", () => expect(DEFAULT_FONT_VARIANT).toBe("playful"));
});
