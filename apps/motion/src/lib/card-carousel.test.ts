import { describe, it, expect } from "vitest";
import {
  cyclicDistance, carouselCard,
  CARD_W, CARD_H, CARD_PITCH, CARD_WINDOW, CARD_FALLOFF,
} from "./card-carousel";

const COUNT = 9;

describe("cyclicDistance", () => {
  it("is 0 at the focused index", () => {
    expect(cyclicDistance(3, 3, COUNT)).toBe(0);
  });
  it("is positive for an index below the focus (upcoming, enters from bottom)", () => {
    expect(cyclicDistance(2, 0, COUNT)).toBeCloseTo(2, 5);
  });
  it("wraps the last card to just below the first (cyclic)", () => {
    // focus on last (8): card 0 is one step forward → +1
    expect(cyclicDistance(0, 8, COUNT)).toBeCloseTo(1, 5);
  });
  it("wraps the first card's predecessor to just above (negative)", () => {
    // focus on 1: card 8 is two steps back → -2
    expect(cyclicDistance(8, 1, COUNT)).toBeCloseTo(-2, 5);
  });
  it("handles a fractional focused position (the continuous-slide path)", () => {
    expect(cyclicDistance(0, 0.5, COUNT)).toBeCloseTo(-0.5, 5);
  });
});

describe("carouselCard", () => {
  it("centered card is full opacity, full scale, no offset, top z-index", () => {
    const s = carouselCard(3, 3, COUNT);
    expect(s.opacity).toBe(1);
    expect(s.scale).toBe(1);
    expect(s.offsetY).toBe(0);
    expect(s.zIndex).toBe(100);
    expect(s.visible).toBe(true);
  });
  it("opacity is 0 exactly at CARD_FALLOFF distance, still visible within the window", () => {
    const s = carouselCard(6, 3, COUNT); // |d|=3
    expect(s.opacity).toBe(0);
    expect(s.visible).toBe(true); // |d| <= CARD_WINDOW(3)
    expect(s.scale).toBeCloseTo(1 - 0.12 * 3, 5);
  });
  it("is not visible beyond the window", () => {
    const s = carouselCard(7, 3, COUNT); // |d|=4
    expect(s.visible).toBe(false);
  });
  it("offsetY is negative above center, positive below, stepped by CARD_PITCH", () => {
    const above = carouselCard(1, 3, COUNT); // d=-2
    const below = carouselCard(5, 3, COUNT); // d=+2
    expect(above.offsetY).toBe(-2 * CARD_PITCH);
    expect(below.offsetY).toBe(2 * CARD_PITCH);
  });
  it("exposes the 4:5 card geometry", () => {
    expect(CARD_W).toBe(560);
    expect(CARD_H).toBe(700);
    expect(CARD_W / CARD_H).toBeCloseTo(4 / 5, 3);
    expect(CARD_WINDOW).toBe(CARD_FALLOFF);
  });
});
