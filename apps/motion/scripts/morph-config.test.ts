import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMorphConfig, DEFAULT_TUNING, SEAM_AFTER_BEAT_DEFAULT } from "./morph-config";

describe("loadMorphConfig", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "mc-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("throws a helpful error when morph.json is absent", () => {
    expect(() => loadMorphConfig(dir)).toThrow(/pnpm seed/);
  });

  it("reads journey + seamAfterBeat + tuning", () => {
    writeFileSync(
      join(dir, "morph.json"),
      JSON.stringify({ journey: { hero: "a", far: "b" }, seamAfterBeat: 6 }),
    );
    const cfg = loadMorphConfig(dir);
    expect(cfg.journey).toEqual({ hero: "a", far: "b" });
    expect(cfg.seamAfterBeat).toBe(6);
    expect(cfg.tuning.slowmo).toBe(DEFAULT_TUNING.slowmo);
  });

  it("fills seamAfterBeat default + tuning defaults for missing fields", () => {
    writeFileSync(join(dir, "morph.json"), JSON.stringify({ journey: { hero: "a", far: "b" } }));
    const cfg = loadMorphConfig(dir);
    expect(cfg.seamAfterBeat).toBe(SEAM_AFTER_BEAT_DEFAULT);
    expect(cfg.tuning).toEqual(DEFAULT_TUNING);
  });

  it("merges partial tuning over defaults", () => {
    writeFileSync(
      join(dir, "morph.json"),
      JSON.stringify({ journey: { hero: "a", far: "b" }, tuning: { slowmo: 0.5 } }),
    );
    const cfg = loadMorphConfig(dir);
    expect(cfg.tuning.slowmo).toBe(0.5);
    expect(cfg.tuning.panFanHalf).toBe(DEFAULT_TUNING.panFanHalf);
  });

  it("throws when journey is missing", () => {
    writeFileSync(join(dir, "morph.json"), JSON.stringify({ seamAfterBeat: 4 }));
    expect(() => loadMorphConfig(dir)).toThrow(/journey/);
  });
});
