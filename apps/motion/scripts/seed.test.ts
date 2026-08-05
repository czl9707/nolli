import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildScenes,
  countText,
  writeMorphJson,
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
    expect(countText(1)).toBe("1 architecture");
    expect(countText(2)).toBe("2 architectures");
  });
});

describe("freshJourney", () => {
  it("hero from manifest, far = farthest from hero", () => {
    expect(freshJourney(manifest)).toEqual({ hero: "a", far: "b" });
  });
});

describe("buildScenes", () => {
  const scenes = buildScenes(manifest);

  it("order: name, detail imgs, count, board imgs, now, morph-1, morph-2, logo", () => {
    expect(scenes.map((s) => s.type)).toEqual([
      "text", "image", "image", "text", "image", "image", "text", "video", "video", "logo",
    ]);
  });
  it("name scene text + size", () => {
    expect(scenes[0]).toEqual({ type: "text", text: "Mies", size: 132, color: "fg" });
  });
  it("detail image srcs are deterministic from building slugs, in order", () => {
    expect(scenes[1]).toEqual({ type: "image", src: "images/a-detail.png" });
    expect(scenes[2]).toEqual({ type: "image", src: "images/b-detail.png" });
  });
  it("count scene uses countText", () => {
    expect(scenes[3]).toEqual({ type: "text", text: "2 architectures", size: 104, color: "fg" });
  });
  it("board image srcs", () => {
    expect(scenes[4]).toEqual({ type: "image", src: "images/a-board.png" });
    expect(scenes[5]).toEqual({ type: "image", src: "images/b-board.png" });
  });
  it("now scene", () => {
    expect(scenes[6]).toEqual({ type: "text", text: "Now available in", size: 104, color: "fgSecondary" });
  });
  it("two morph videos, morph-2 carries endStill + rate 2", () => {
    expect(scenes[7]).toEqual({ type: "video", src: "morph-1.mp4", playbackRate: 2 });
    expect(scenes[8]).toEqual({ type: "video", src: "morph-2.mp4", playbackRate: 2, endStill: "morph-end.png" });
  });
  it("ends on logo", () => {
    expect(scenes[9]).toEqual({ type: "logo" });
  });
});

describe("writeMorphJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes journey + default seam + default tuning when absent", () => {
    writeMorphJson(dir, manifest);
    const cfg = JSON.parse(readFileSync(join(dir, "morph.json"), "utf8"));
    expect(cfg.journey).toEqual({ hero: "a", far: "b" });
    expect(cfg.seamAfterBeat).toBe(4);
    expect(cfg.tuning.slowmo).toBe(0.4);
  });

  it("preserves hand-edited journey + seam + tuning overrides on rerun", () => {
    writeMorphJson(dir, manifest);
    const first = JSON.parse(readFileSync(join(dir, "morph.json"), "utf8"));
    first.journey = { hero: "b", far: "a" };
    first.seamAfterBeat = 6;
    first.tuning.slowmo = 0.5;
    writeFileSync(join(dir, "morph.json"), JSON.stringify(first));

    writeMorphJson(dir, manifest);
    const cfg = JSON.parse(readFileSync(join(dir, "morph.json"), "utf8"));
    expect(cfg.journey).toEqual({ hero: "b", far: "a" });
    expect(cfg.seamAfterBeat).toBe(6);
    expect(cfg.tuning.slowmo).toBe(0.5);
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
    expect(cfg.scenes).toHaveLength(10);
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
    expect(cfg.scenes).toHaveLength(10);
  });
});
