import { describe, expect, it } from "vitest";
import { WALK_VARIANTS, isWalkVariant, parseVariantArg } from "./variant";

describe("variant", () => {
  it("grid is the shipped variant", () => {
    expect(WALK_VARIANTS).toContain("grid");
  });
  it("isWalkVariant accepts members only", () => {
    expect(isWalkVariant("grid")).toBe(true);
    expect(isWalkVariant("nope")).toBe(false);
  });
  it("parseVariantArg defaults to grid and rejects unknowns", () => {
    expect(parseVariantArg(undefined)).toBe("grid");
    expect(() => parseVariantArg("nope")).toThrow(/Unknown variant/);
  });
});
