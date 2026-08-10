import { describe, it, expect } from "vitest";
import {
  cyclicDistance, carouselCard,
  CARD_W, CARD_H, CARD_PITCH, CARD_DEPTH, VEIL_CAP,
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
  it("centered card is full scale, no offset, top z-index, no veil", () => {
    const s = carouselCard(3, 3, COUNT);
    expect(s.scale).toBe(1);
    expect(s.offsetY).toBe(0);
    expect(s.zIndex).toBe(100);
    expect(s.visible).toBe(true);
    expect(s.veilOpacity).toBe(0);
  });
  it("veil darkens with depth, capping at VEIL_CAP on the outermost card", () => {
    expect(carouselCard(4, 3, COUNT).veilOpacity).toBeCloseTo(VEIL_CAP / 2, 5); // |d|=1 → half cap
    expect(carouselCard(5, 3, COUNT).veilOpacity).toBeCloseTo(VEIL_CAP, 5);     // |d|=2 → cap
  });
  it("offset uses diminishing pitch: 2nd card one step, 3rd card only half a step more", () => {
    const first = carouselCard(4, 3, COUNT);  // |d|=1 → one CARD_PITCH step
    const second = carouselCard(5, 3, COUNT); // |d|=2 → 1.5× CARD_PITCH (half step more)
    expect(first.offsetY).toBe(CARD_PITCH);
    expect(second.offsetY).toBe(CARD_PITCH * 1.5);
  });
  it("offsetY is negative above center, positive below", () => {
    expect(carouselCard(2, 3, COUNT).offsetY).toBe(-CARD_PITCH); // d=-1
    expect(carouselCard(4, 3, COUNT).offsetY).toBe(CARD_PITCH);  // d=+1
  });
  it("is visible up to CARD_DEPTH, culled beyond (no dissolve)", () => {
    expect(carouselCard(5, 3, COUNT).visible).toBe(true);  // |d|=2 = outermost
    expect(carouselCard(6, 3, COUNT).visible).toBe(false); // |d|=3 → culled
  });
  it("exposes the 4:5 card geometry at ~70% canvas height", () => {
    expect(CARD_W).toBe(608);
    expect(CARD_H).toBe(760);
    expect(CARD_W / CARD_H).toBeCloseTo(4 / 5, 3);
    expect(CARD_H / 1080).toBeGreaterThanOrEqual(0.7);
    expect(CARD_DEPTH).toBe(2);
  });
});
