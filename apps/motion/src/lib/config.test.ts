import { describe, it, expect } from "vitest";
import { reelTitle } from "./config";

describe("reelTitle", () => {
  it("appends the chronological-walk tagline to the architect name", () => {
    expect(reelTitle("SANAA")).toBe("SANAA's work over time");
    expect(reelTitle("Tadao Ando")).toBe("Tadao Ando's work over time");
  });
});
