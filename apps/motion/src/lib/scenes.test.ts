import { describe, it, expect } from "vitest";
import { durationOf, totalDuration, DEFAULT_TEXT_SIZE } from "./scenes";
import { OUTRO, segmentDuration, LOGO_WORD } from "./outro";
import { STILL_FRAMES, scene2Duration } from "./timing";

describe("durationOf", () => {
  it("text = segmentDuration(text.length, typeStart.name)", () => {
    expect(durationOf({ type: "text", text: "Mies" })).toBe(
      segmentDuration(4, OUTRO.typeStart.name),
    );
  });
  it("image = STILL_FRAMES", () => {
    expect(durationOf({ type: "image", src: "x.png" })).toBe(STILL_FRAMES);
  });
  it("video = ceil(frames / playbackRate)", () => {
    expect(durationOf({ type: "video", src: "m.mp4", frames: 300, playbackRate: 2 })).toBe(
      Math.ceil(300 / 2),
    );
  });
  it("video falls back to scene2Duration at default rate when no frames", () => {
    expect(durationOf({ type: "video", src: "m.mp4" })).toBe(
      Math.ceil(scene2Duration / 1),
    );
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
});
