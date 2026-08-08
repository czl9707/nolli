import { describe, it, expect } from "vitest";
import { visibleWindow } from "./visible-window";

describe("visibleWindow", () => {
  it("returns all indices when count fits the window", () => {
    expect(visibleWindow({ currentIndex: 1, count: 3, windowSize: 5 })).toEqual([0, 1, 2]);
  });
  it("centers the active index", () => {
    expect(visibleWindow({ currentIndex: 4, count: 9, windowSize: 5 })).toEqual([2, 3, 4, 5, 6]);
  });
  it("clamps to the start when active is near the beginning", () => {
    expect(visibleWindow({ currentIndex: 0, count: 9, windowSize: 5 })).toEqual([0, 1, 2, 3, 4]);
    expect(visibleWindow({ currentIndex: 1, count: 9, windowSize: 5 })).toEqual([0, 1, 2, 3, 4]);
  });
  it("clamps to the end when active is near the finish", () => {
    expect(visibleWindow({ currentIndex: 8, count: 9, windowSize: 5 })).toEqual([4, 5, 6, 7, 8]);
    expect(visibleWindow({ currentIndex: 7, count: 9, windowSize: 5 })).toEqual([4, 5, 6, 7, 8]);
  });
});
