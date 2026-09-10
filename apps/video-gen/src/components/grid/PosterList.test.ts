import { describe, expect, it } from "vitest";
import { landFrame } from "@/lib/timeline";
import { ROW_STRIDE, listShift } from "./PosterList";

const SLIDE_F = Math.round(0.3 * 45);

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
