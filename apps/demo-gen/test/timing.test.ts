import { describe, expect, it } from "vitest";
import { FPS, STILL_FRAMES, scene2Duration } from "../src/lib/timing";

describe("timing constants", () => {
  it("exposes FPS, STILL_FRAMES, scene2Duration", () => {
    expect(FPS).toBe(30);
    expect(STILL_FRAMES).toBe(18);
    expect(scene2Duration).toBe(150);
  });
});
