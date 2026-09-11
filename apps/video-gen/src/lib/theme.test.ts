import { describe, expect, it } from "vitest";
import { REEL_THEMES, isReelTheme, parseThemeArg } from "./theme";

describe("theme", () => {
  it("offers light and dark", () => {
    expect(REEL_THEMES).toEqual(["light", "dark"]);
  });
  it("isReelTheme accepts members only", () => {
    expect(isReelTheme("light")).toBe(true);
    expect(isReelTheme("dark")).toBe(true);
    expect(isReelTheme("nope")).toBe(false);
  });
  it("parseThemeArg defaults to light and rejects unknowns", () => {
    expect(parseThemeArg(undefined)).toBe("light");
    expect(parseThemeArg("dark")).toBe("dark");
    expect(() => parseThemeArg("nope")).toThrow(/Unknown theme/);
  });
});
