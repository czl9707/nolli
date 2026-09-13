import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { freshJourney } from "./seed-architect";
import {
  architectScenes,
  architectShots,
  architectureScenes,
  architectureShots,
  shotSrc,
  writeDemoJson,
  writeImagesJson,
  writeVideoJson,
} from "./seed-common";
import { countText } from "../../src/lib/constants";
import type { Manifest } from "./manifest";

const manifest: Manifest = {
  architect: "Mies",
  slug: "mies",
  buildings: [
    { slug: "a", name: "A", city: "X", cc: "US", latitude: 0, longitude: 0 },
    { slug: "b", name: "B", city: "Y", cc: "US", latitude: 0, longitude: 90 },
  ],
};

describe("countText", () => {
  it("singular vs plural", () => {
    expect(countText(1)).toBe("1 Architecture");
    expect(countText(2)).toBe("2 Architectures");
  });
});

describe("freshJourney", () => {
  it("opens on the earliest building, then one other", () => {
    expect(freshJourney(manifest)).toEqual(["a", "b"]);
  });
});

describe("shotSrc", () => {
  it("board shot → images/<building>-board-<n>.png", () => {
    expect(shotSrc({ building: "a", type: "board", photo: 2 })).toBe("images/a-board-2.png");
  });
  it("detail shot → images/<building>-detail.png", () => {
    expect(shotSrc({ building: "a", type: "detail" })).toBe("images/a-detail.png");
  });
});

describe("architectShots", () => {
  it("detail + board:0 per building, in manifest order", () => {
    expect(architectShots(manifest)).toEqual([
      { building: "a", type: "detail" },
      { building: "a", type: "board", photo: 0 },
      { building: "b", type: "detail" },
      { building: "b", type: "board", photo: 0 },
    ]);
  });
});

describe("architectureShots", () => {
  it("board:0..N-1 for the building, no detail", () => {
    expect(architectureShots("a", 3)).toEqual([
      { building: "a", type: "board", photo: 0 },
      { building: "a", type: "board", photo: 1 },
      { building: "a", type: "board", photo: 2 },
    ]);
  });
});

describe("architectScenes", () => {
  const scenes = architectScenes(manifest, architectShots(manifest));

  // Leads with the demo chunk (journey → board reveal), then alternates
  // name, board photos, count, detail photos, "Now available in", logo.
  it("order: demo-1, name, board imgs, count, detail imgs, now, logo", () => {
    expect(scenes.map((s) => s.type)).toEqual([
      "video", "text", "image", "image", "text", "image", "image", "text", "logo",
    ]);
  });
  it("single demo chunk first", () => {
    expect(scenes[0]).toEqual({ type: "video", src: "demo-1.mp4", playbackRate: 2 });
  });
  it("name scene text + size", () => {
    expect(scenes[1]).toEqual({ type: "text", text: "Mies", size: 132 });
  });
  it("board image srcs, deterministic from building slugs, in order", () => {
    expect(scenes[2]).toEqual({ type: "image", src: "images/a-board-0.png" });
    expect(scenes[3]).toEqual({ type: "image", src: "images/b-board-0.png" });
  });
  it("count scene uses countText", () => {
    expect(scenes[4]).toEqual({ type: "text", text: "2 Architectures", size: 104 });
  });
  it("detail image srcs", () => {
    expect(scenes[5]).toEqual({ type: "image", src: "images/a-detail.png" });
    expect(scenes[6]).toEqual({ type: "image", src: "images/b-detail.png" });
  });
  it("now card then logo", () => {
    expect(scenes[7]).toEqual({ type: "text", text: "Now available in", size: 104 });
    expect(scenes[8]).toEqual({ type: "logo" });
  });
});

describe("architectureScenes", () => {
  const b = {
    slug: "pavilion",
    name: "Barcelona Pavilion",
    city: "Barcelona",
    cc: "ES",
    latitude: 0,
    longitude: 0,
  };
  const single: Manifest = { architect: "Mies", slug: "pavilion", buildings: [b] };
  const scenes = architectureScenes(single, architectureShots("pavilion", 2));

  it("order: demo-1, name, architect, place, board imgs, now, logo", () => {
    expect(scenes.map((s) => s.type)).toEqual([
      "video", "text", "text", "text", "image", "image", "text", "logo",
    ]);
  });
  it("single demo chunk first, at 1.5x", () => {
    expect(scenes[0]).toEqual({ type: "video", src: "demo-1.mp4", playbackRate: 1.5 });
  });
  it("building name 132, architect 104", () => {
    expect(scenes[1]).toEqual({ type: "text", text: "Barcelona Pavilion", size: 132 });
    expect(scenes[2]).toEqual({ type: "text", text: "Mies", size: 104 });
  });
  it("place card joins city + cc", () => {
    expect(scenes[3]).toEqual({ type: "text", text: "Barcelona, ES", size: 104 });
  });
  it("cc-only place card drops the city half", () => {
    const s = architectureScenes(
      { ...single, buildings: [{ ...b, city: "" }] },
      architectureShots("pavilion", 2),
    );
    expect(s[3]).toEqual({ type: "text", text: "ES", size: 104 });
  });
  it("no place card when city and cc are both empty", () => {
    const s = architectureScenes(
      { ...single, buildings: [{ ...b, city: "", cc: "" }] },
      architectureShots("pavilion", 2),
    );
    expect(s.map((x) => x.type)).toEqual([
      "video", "text", "text", "image", "image", "text", "logo",
    ]);
  });
  it("board image srcs follow the shot list", () => {
    expect(scenes[4]).toEqual({ type: "image", src: "images/pavilion-board-0.png" });
    expect(scenes[5]).toEqual({ type: "image", src: "images/pavilion-board-1.png" });
  });
  it("now card then logo", () => {
    expect(scenes[6]).toEqual({ type: "text", text: "Now available in", size: 104 });
    expect(scenes[7]).toEqual({ type: "logo" });
  });
});

describe("writeDemoJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes the journey, and no tuning block", () => {
    writeDemoJson(dir, freshJourney(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "demo.json"), "utf8"));
    expect(cfg.journey).toEqual(["a", "b"]);
    expect(cfg.tuning).toBeUndefined();
  });

  it("preserves a hand-edited journey on rerun", () => {
    writeDemoJson(dir, freshJourney(manifest));
    writeFileSync(join(dir, "demo.json"), JSON.stringify({ journey: ["b", "a"] }));

    writeDemoJson(dir, freshJourney(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "demo.json"), "utf8"));
    expect(cfg.journey).toEqual(["b", "a"]);
  });
});

describe("writeImagesJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes the shot list when absent", () => {
    const shots = writeImagesJson(dir, architectShots(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "images.json"), "utf8"));
    expect(cfg.shots).toEqual(shots);
    expect(cfg.shots).toHaveLength(4);
  });

  it("preserves a hand-edited shot list on rerun", () => {
    writeImagesJson(dir, architectShots(manifest));
    const edited = [{ building: "a", type: "board", photo: 1 }];
    writeFileSync(join(dir, "images.json"), JSON.stringify({ shots: edited }));

    const shots = writeImagesJson(dir, architectShots(manifest));
    const cfg = JSON.parse(readFileSync(join(dir, "images.json"), "utf8"));
    expect(cfg.shots).toEqual(edited); // unchanged
    expect(shots).toEqual(edited);
  });
});

describe("writeVideoJson", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "seed-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes the scene list when absent", () => {
    writeVideoJson(dir, "mies", architectScenes(manifest, architectShots(manifest)));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.slug).toBe("mies");
    expect(cfg.scenes).toHaveLength(9);
  });

  it("preserves an existing video.json for the same slug (no overwrite)", () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "video.json"), JSON.stringify({ slug: "mies", scenes: [{ type: "logo" }] }));
    writeVideoJson(dir, "mies", architectScenes(manifest, architectShots(manifest)));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.scenes).toEqual([{ type: "logo" }]); // unchanged
  });

  it("overwrites when the existing slug differs", () => {
    writeFileSync(join(dir, "video.json"), JSON.stringify({ slug: "other", scenes: [] }));
    writeVideoJson(dir, "mies", architectScenes(manifest, architectShots(manifest)));
    const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
    expect(cfg.slug).toBe("mies");
    expect(cfg.scenes).toHaveLength(9);
  });
});
