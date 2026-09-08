import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDemoConfig, DEFAULT_TUNING } from "./demo-config";

describe("loadDemoConfig", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "mc-")); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("throws a helpful error when demo.json is absent", () => {
    expect(() => loadDemoConfig(dir)).toThrow(/pnpm seed/);
  });

  it("reads journey + tuning", () => {
    writeFileSync(join(dir, "demo.json"), JSON.stringify({ journey: ["a", "b"] }));
    const cfg = loadDemoConfig(dir);
    expect(cfg.journey).toEqual(["a", "b"]);
    expect(cfg.tuning).toEqual(DEFAULT_TUNING);
  });

  it("ignores a tuning block in the file (tuning is code-only)", () => {
    writeFileSync(
      join(dir, "demo.json"),
      JSON.stringify({ journey: ["a", "b"], tuning: { slowmo: 0.5 } }),
    );
    const cfg = loadDemoConfig(dir);
    expect(cfg.tuning).toEqual(DEFAULT_TUNING);
    expect(cfg.tuning.slowmo).toBe(DEFAULT_TUNING.slowmo);
  });

  it("throws when journey is missing or shorter than 2", () => {
    writeFileSync(join(dir, "demo.json"), JSON.stringify({}));
    expect(() => loadDemoConfig(dir)).toThrow(/journey/);
    writeFileSync(join(dir, "demo.json"), JSON.stringify({ journey: ["a"] }));
    expect(() => loadDemoConfig(dir)).toThrow(/journey/);
  });
});
