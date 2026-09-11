import { describe, expect, it } from "vitest";
import { OPEN_FRAMES, openExitEnd, landFrame } from "@/lib/timeline";
import { ROW_STRIDE, listShift, openingRows } from "./PosterList";

const SLIDE_F = Math.round(0.3 * 45);

describe("openingRows", () => {
  it("first-capacity rows are landed through the opening hold", () => {
    expect(openingRows(0, 10, 8)).toBe(8);
    expect(openingRows(OPEN_FRAMES - 1, 10, 8)).toBe(8);
    expect(openingRows(0, 5, 8)).toBe(5); // fewer buildings than capacity
  });
  it("resets before the walk", () => {
    expect(openingRows(openExitEnd(), 10, 8)).toBe(0);
  });
});

describe("listShift", () => {
  it("no shift while everything fits", () => {
    expect(listShift(landFrame(9), 10, 12)).toBe(0);
  });
  it("no shift before the window fills", () => {
    expect(listShift(landFrame(3), 10, 7)).toBe(0);
  });
  it("steps one stride per slot after the capacity landing", () => {
    expect(listShift(landFrame(7), 10, 7)).toBe(0); // easing just started
    const midSlide = landFrame(7) + SLIDE_F;
    expect(listShift(midSlide, 10, 7)).toBe(-ROW_STRIDE);
    expect(listShift(landFrame(8) + SLIDE_F, 10, 7)).toBe(-2 * ROW_STRIDE);
  });
  it("caps at the last row", () => {
    expect(listShift(landFrame(20), 10, 7)).toBe(-3 * ROW_STRIDE);
  });
});
