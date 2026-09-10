import { resolve } from "node:path";

export const outDir = (slug: string) => resolve("out", slug);
export const reelConfigPath = (slug: string) => resolve(outDir(slug), "reel.json");
export const dataDir = (slug: string) => resolve("public", "data", slug);
