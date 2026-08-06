import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildScenes,
  countText,
  writeDemoJson,
  writeVideoJson,
  freshJourney,
} from "./seed";
import type { Manifest } from "./manifest";

const manifest: Manifest = {
  architect: "Mies",
  slug: "mies",
  count: 2,
  hero: "a",
  buildings: [
    { slug: "a", name: "A", year: 1, city: "X", cc: "US", latitude: 0, longitude: 0 },
    { slug: "b", name: "B", year: 2, city: "Y", cc: "US", latitude: 0, longitude: 90 },
  ],
};

describe("countText", () => {
  it("singular vs plural", () => {
    expect(countText(1)).toBe("1 Architecture");
    expect(countText(2)).toBe("2 Architectures");
  });
});

describe("freshJourney", () => {
  it("hero from manifest, far = farthest from hero", () => {
    expect(freshJourney(manifest)).toEqual({ hero: "a", far: "b" });
  });
});

describe("buildScenes", () => {
  const scenes = buildScenes(manifest);

  // Lead with board photos (social thumbnail), then name, detail photos, count,
  // a single demo chunk (journey → board reveal), "Now available in", logo.
  it("order: board imgs, name, detail imgs, count, demo-1, now, logo", () => {
    expect(scenes.map((s) => s.type)).toEqual([
      "image", "image", "text", "image", "image", "text", "video", "text", "logo",
    ]);
  });
  it("board image srcs come first, deterministic from building slugs, in order", () => {
    expect(scenes[0]).toEqual({ type: "image", src: "images/a-board.png" });
    expect(scenes[1]).toEqual({ type: "image", src: "images/b-board.png" });
  });
  it("name scene text + size", () => {
    expect(scenes[2]).toEqual({ type: "text", text: "Mies", size: 132, color: "fg" });
  });
  it("detail image srcs", () => {
    expect(scenes[3]).toEqual({ type: "image", src: "images/a-detail.png" });
    expect(scenes[4]).toEqual({ type: "image", src: "images/b-detail.png" });
  });
  it("count scene uses countText", () => {
    expect(scenes[5]).toEqual({ type: "text", text: "2 Architectures", size: 104, color: "fg" });
  });
  it("single demo chunk then now card then logo", () => {
    expect(scenes[6]).toEqual({ type: "video", src: "demo-1.mp4", playbackRate: 2 });
    expect(scenes[7]).toEqual({ type: "text", text: "Now available in", size: 104, color: "fg" });
    expect(scenes[8]).toEqual({ type: "logo" });
  });
});

describe("writeDemoJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes journey + default seam, and no tuning block", () => {
    writeDemoJson(dir, manifest);
    const cfg = JSON.parse(readFileSync(join(dir, "demo.json"), "utf8"));
    expect(cfg.journey).toEqual({ hero: "a", far: "b" });
    expect(cfg.seamAfterBeat).toBe(5);
    expect(cfg.tuning).toBeUndefined();
  });

  it("preserves hand-edited journey + seam on rerun", () => {
    writeDemoJson(dir, manifest);
    const first = JSON.parse(readFileSync(join(dir, "demo.json"), "utf8"));
    first.journey = { hero: "b", far: "a" };
    first.seamAfterBeat = 6;
    writeFileSync(join(dir, "demo.json"), JSON.stringify(first));

    writeDemoJson(dir, manifest);
    const cfg = JSON.parse(readFileSync(join(dir, "demo.json"), "utf8"));
    expect(cfg.journey).toEqual({ hero: "b", far: "a" });
    expect(cfg.seamAfterBeat).toBe(6);
  });
});

describe("writeVideoJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes the scene list when absent", () => {
    writeVideoJson(dir, "mies", buildScenes(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.slug).toBe("mies");
    expect(cfg.fontVariant).toBe("playful");
    expect(cfg.scenes).toHaveLength(9);
  });

  it("preserves an existing video.json for the same slug (no overwrite)", () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "video.json"), JSON.stringify({ slug: "mies", scenes: [{ type: "logo" }] }));
    writeVideoJson(dir, "mies", buildScenes(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.scenes).toEqual([{ type: "logo" }]); // unchanged
  });

  it("overwrites when the existing slug differs", () => {
    writeFileSync(join(dir, "video.json"), JSON.stringify({ slug: "other", scenes: [] }));
    writeVideoJson(dir, "mies", buildScenes(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.slug).toBe("mies");
    expect(cfg.scenes).toHaveLength(9);
  });
});
