import { describe, expect, it } from "vitest";
import { FPS, scene1Duration, scene2Duration, scene3Duration, totalDuration, STILL_FRAMES } from "../src/lib/timing";

const manifest = { architect: "SANAA", count: 9 };

describe("timing", () => {
  it("computes scene1 length from still count", () => {
    expect(scene1Duration(9)).toBe(STILL_FRAMES * 9);
  });
  it("totals the three scenes", () => {
    expect(totalDuration(9, true, manifest)).toBe(
      scene1Duration(9) + scene2Duration + scene3Duration(manifest),
    );
  });
  it("FPS is 30", () => expect(FPS).toBe(30));
});
