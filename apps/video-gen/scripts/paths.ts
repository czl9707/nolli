import { resolve } from "node:path";

export const outDir = (slug: string) => resolve("out", slug);
export const reelConfigPath = (slug: string) => resolve(outDir(slug), "reel.json");
export const allBuildingsPath = () => resolve("out", "all-buildings.json");
export const captureDir = (slug: string) => resolve("public", "capture", slug);
export const captureAllBuildingsPath = () => resolve("public", "capture", "all-buildings.json");
