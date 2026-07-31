import { describe, expect, it } from "vitest";
import { kenBurns } from "../src/lib/kenburns";

describe("kenBurns", () => {
  it("starts at scale 1 and grows", () => {
    expect(kenBurns(0, 30).scale).toBeCloseTo(1);
    expect(kenBurns(30, 30).scale).toBeGreaterThan(1);
  });
  it("opacity ramps in then out across the still", () => {
    expect(kenBurns(0, 30).opacity).toBeCloseTo(0);
    expect(kenBurns(8, 30).opacity).toBeCloseTo(1);
    expect(kenBurns(30, 30).opacity).toBeCloseTo(0);
  });
});
