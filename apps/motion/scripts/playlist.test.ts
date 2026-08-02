import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  seedPlaylist,
  mergePlaylist,
  validatePlaylist,
  loadPlaylist,
  DEFAULT_TEXT,
  type Playlist,
} from "./playlist";

describe("seedPlaylist", () => {
  it("builds a playlist with default text and null morph", () => {
    const p = seedPlaylist("sanaa", ["images/a-detail.png", "images/b-board.png"]);
    expect(p.slug).toBe("sanaa");
    expect(p.images).toEqual(["images/a-detail.png", "images/b-board.png"]);
    expect(p.text).toBe(DEFAULT_TEXT);
    expect(p.morph).toBeNull();
  });
});

describe("mergePlaylist", () => {
  it("appends only new images, preserving existing order and edits", () => {
    const existing: Playlist = {
      slug: "sanaa",
      images: ["images/b-board.png", "images/a-detail.png"], // user reordered
      text: "kinetic", // user picked
      morph: null,
    };
    const merged = mergePlaylist(existing, ["images/a-detail.png", "images/c-detail.png"]);
    expect(merged.images).toEqual([
      "images/b-board.png",
      "images/a-detail.png",
      "images/c-detail.png",
    ]);
    expect(merged.text).toBe("kinetic"); // edit preserved
    expect(merged.slug).toBe("sanaa");
  });
});

describe("validatePlaylist", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pl-"));
    mkdirSync(join(dir, "images"), { recursive: true });
    writeFileSync(join(dir, "images/a-detail.png"), "x");
    writeFileSync(join(dir, "morph.mp4"), "x");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns no missing when all files exist", () => {
    const p: Playlist = {
      slug: "sanaa",
      images: ["images/a-detail.png"],
      text: "line-wipe",
      morph: "morph.mp4",
    };
    expect(validatePlaylist(p, dir)).toEqual([]);
  });

  it("lists missing images and morph", () => {
    const p: Playlist = {
      slug: "sanaa",
      images: ["images/a-detail.png", "images/ghost.png"],
      text: "line-wipe",
      morph: "ghost.mp4",
    };
    expect(validatePlaylist(p, dir).sort()).toEqual(["ghost.mp4", "images/ghost.png"]);
  });

  it("does not check morph when null", () => {
    const p: Playlist = {
      slug: "sanaa",
      images: ["images/a-detail.png"],
      text: "line-wipe",
      morph: null,
    };
    expect(validatePlaylist(p, dir)).toEqual([]);
  });
});

describe("loadPlaylist", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pl-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("throws a helpful error when video.json is absent", () => {
    expect(() => loadPlaylist(dir)).toThrow(/assets:images/);
  });

  it("reads and parses video.json", () => {
    writeFileSync(
      join(dir, "video.json"),
      JSON.stringify({ slug: "sanaa", images: ["images/a.png"], text: "kinetic", morph: null }),
    );
    expect(loadPlaylist(dir).text).toBe("kinetic");
  });
});
