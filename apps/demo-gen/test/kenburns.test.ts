import { describe, expect, it } from "vitest";
import { kenBurns } from "../src/lib/kenburns";

describe("kenBurns", () => {
  it("is fully static — no zoom, pan, or fade", () => {
    const a = kenBurns(0, 30);
    const b = kenBurns(15, 30);
    const c = kenBurns(30, 30);
    for (const k of [a, b, c]) {
      expect(k.scale).toBe(1);
      expect(k.x).toBe(0);
      expect(k.y).toBe(0);
      expect(k.opacity).toBe(1);
    }
    expect(a).toEqual(c);
  });
});
