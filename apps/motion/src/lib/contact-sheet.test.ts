import { describe, it, expect } from "vitest";
import { visibleWindow } from "./contact-sheet";

describe("visibleWindow", () => {
  it("returns all indices when count <= window", () => {
    expect(visibleWindow({ currentIndex: 1, count: 4, windowSize: 7 })).toEqual([0, 1, 2, 3]);
  });
  it("centers the current index when count > window", () => {
    expect(visibleWindow({ currentIndex: 5, count: 10, windowSize: 5 })).toEqual([3, 4, 5, 6, 7]);
  });
  it("clamps to the start", () => {
    expect(visibleWindow({ currentIndex: 0, count: 10, windowSize: 5 })).toEqual([0, 1, 2, 3, 4]);
  });
  it("clamps to the end", () => {
    expect(visibleWindow({ currentIndex: 9, count: 10, windowSize: 5 })).toEqual([5, 6, 7, 8, 9]);
  });
});
