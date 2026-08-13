import { describe, it, expect } from "vitest";
import { buildCameraSegments, FLY_FRAC } from "./camera-segments";
import { ctaStart, SLOT_FRAMES, secToFrames, CTA_S, WALK_START } from "./timeline";
import type { ReelBuilding } from "./config";

const b = (slug: string, lng: number, lat: number): ReelBuilding =>
  ({ slug, name: slug, year: 2020, city: "X", countryCode: "XX", coordinates: { lng, lat }, coverImage: "" } as ReelBuilding);

const buildings = [b("a", 0, 0), b("b", 10, 10), b("c", 20, 20)];
const worldVP = { center: [5, 5] as [number, number], zoom: 2 };

describe("buildCameraSegments", () => {
  it("produces 2N+1 segments (Hold→Flight alternating, ending on Hold)", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    expect(segs.length).toBe(2 * buildings.length + 1);
    expect(segs[0].kind).toBe("hold");
    expect(segs[segs.length - 1].kind).toBe("hold");
    for (let i = 0; i < segs.length; i++) {
      expect(segs[i].kind).toBe(i % 2 === 0 ? "hold" : "flight");
    }
  });

  it("first Hold is the world viewport with duration WALK_START (holdWorldFrames)", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    const first = segs[0];
    expect(first.kind).toBe("hold");
    if (first.kind !== "hold") return;
    expect(first.at).toBe(worldVP);
    expect(first.durationInFrames).toBe(WALK_START);
  });

  it("contiguity by reference: each segment's to === next segment's from/at", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    for (let i = 0; i < segs.length - 1; i++) {
      const cur = segs[i];
      const nxt = segs[i + 1];
      const curTo = cur.kind === "flight" ? cur.to : cur.at;
      const nxtFrom = nxt.kind === "flight" ? nxt.from : nxt.at;
      expect(nxtFrom).toBe(curTo);
    }
  });

  it("per-building Hold.at points at building coords + cruise zoom", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    const holdB0 = segs[2];
    if (holdB0.kind !== "hold") throw new Error("expected hold");
    expect(holdB0.at.center).toEqual([buildings[0].coordinates.lng, buildings[0].coordinates.lat]);
    expect(holdB0.at.zoom).toBe(15);
  });

  it("total duration === full reel (ctaStart(count) + CTA)", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    const total = segs.reduce((s, x) => s + x.durationInFrames, 0);
    expect(total).toBe(ctaStart(buildings.length) + secToFrames(CTA_S));
  });

  it("fly/hold durations derive from FLY_FRAC and SLOT_FRAMES (no independent rounding)", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    const fly = segs[1];
    const hold = segs[2];
    if (fly.kind !== "flight" || hold.kind !== "hold") throw new Error("expected flight/hold");
    expect(fly.durationInFrames).toBe(Math.round(FLY_FRAC * SLOT_FRAMES));
    expect(hold.durationInFrames).toBe(SLOT_FRAMES - fly.durationInFrames);
  });

  it("selectedSlug: world segments undefined; per-building segments = building slug", () => {
    const segs = buildCameraSegments(buildings, worldVP, 15);
    expect(segs[0].kind).toBe("hold");
    if (segs[0].kind !== "hold") return;
    expect(segs[0].selectedSlug).toBeUndefined();
    // Flight into b0 + Hold(b0) both highlight b0
    const fly0 = segs[1]; if (fly0.kind !== "flight") throw new Error();
    const hold0 = segs[2]; if (hold0.kind !== "hold") throw new Error();
    expect(fly0.selectedSlug).toBe("a");
    expect(hold0.selectedSlug).toBe("a");
    const holdLast = segs[segs.length - 1]; if (holdLast.kind !== "hold") throw new Error();
    expect(holdLast.selectedSlug).toBe("c");
  });
});
