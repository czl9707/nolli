import { resolve } from "node:path";

export const outDir = (slug: string) => resolve("out", slug);
export const reelConfigPath = (slug: string) => resolve(outDir(slug), "reel.json");
export const allArchPath = () => resolve("out", "all-arch.json");
export const captureDir = (slug: string) => resolve("public", "capture", slug);
export const captureAllArchPath = () => resolve("public", "capture", "all-arch.json");
