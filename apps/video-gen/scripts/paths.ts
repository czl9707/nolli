import { resolve } from "node:path";

export const outDir = (slug: string) => resolve("out", slug);
export const reelConfigPath = (slug: string) => resolve(outDir(slug), "reel.json");
export const allArchPath = () => resolve("out", "all-arch.json");
export const dataDir = (slug: string) => resolve("public", "data", slug);
export const dataAllArchPath = () => resolve("public", "data", "all-arch.json");
