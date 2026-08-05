import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  seedPlaylist,
  mergePlaylist,
  validatePlaylist,
  loadPlaylist,
  type Playlist,
} from "./playlist";

const journey = { hero: "a", far: "b" };

describe("seedPlaylist", () => {
  it("builds a playlist with detail/board/journey and null morph", () => {
    const p = seedPlaylist("sanaa", ["images/a-detail.png"], ["images/a-board.png"], journey);
    expect(p.slug).toBe("sanaa");
    expect(p.detail).toEqual(["images/a-detail.png"]);
    expect(p.board).toEqual(["images/a-board.png"]);
    expect(p.journey).toEqual(journey);
    expect(p.morph).toBeNull();
  });
});

describe("mergePlaylist", () => {
  it("appends only new images per list, preserving order, slug, journey, morph", () => {
    const existing: Playlist = {
      slug: "sanaa",
      detail: ["images/b-detail.png"],
      board: ["images/b-board.png"],
      journey,
      morph: "morph.mp4",
    };
    const merged = mergePlaylist(
      existing,
      ["images/b-detail.png", "images/c-detail.png"],
      ["images/b-board.png", "images/c-board.png"],
    );
    expect(merged.detail).toEqual(["images/b-detail.png", "images/c-detail.png"]);
    expect(merged.board).toEqual(["images/b-board.png", "images/c-board.png"]);
    expect(merged.slug).toBe("sanaa");
    expect(merged.journey).toEqual(journey);
    expect(merged.morph).toBe("morph.mp4");
  });
});

describe("validatePlaylist", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pl-"));
    mkdirSync(join(dir, "images"), { recursive: true });
    writeFileSync(join(dir, "images/a-detail.png"), "x");
    writeFileSync(join(dir, "images/a-board.png"), "x");
    writeFileSync(join(dir, "morph.mp4"), "x");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns no missing when all files exist", () => {
    const p: Playlist = {
      slug: "sanaa",
      detail: ["images/a-detail.png"],
      board: ["images/a-board.png"],
      journey,
      morph: "morph.mp4",
    };
    expect(validatePlaylist(p, dir)).toEqual([]);
  });

  it("lists missing detail, board, and morph", () => {
    const p: Playlist = {
      slug: "sanaa",
      detail: ["images/a-detail.png", "images/ghost-d.png"],
      board: ["images/a-board.png", "images/ghost-b.png"],
      journey,
      morph: "ghost.mp4",
    };
    expect(validatePlaylist(p, dir).sort()).toEqual([
      "ghost.mp4",
      "images/ghost-b.png",
      "images/ghost-d.png",
    ]);
  });

  it("does not check morph when null", () => {
    const p: Playlist = {
      slug: "sanaa",
      detail: ["images/a-detail.png"],
      board: ["images/a-board.png"],
      journey,
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
      JSON.stringify({ slug: "sanaa", detail: [], board: [], journey, morph: null }),
    );
    expect(loadPlaylist(dir).slug).toBe("sanaa");
  });
});
