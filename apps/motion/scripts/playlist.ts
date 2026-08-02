import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Kept as a literal union here (not imported from src, which pulls in remotion)
// so the scripts stay render-agnostic. Must match Scene3Count.TextVariant.
export type TextVariantName = "line-wipe" | "kinetic" | "minimal";
export const TEXT_VARIANTS: TextVariantName[] = ["line-wipe", "kinetic", "minimal"];
export const DEFAULT_TEXT: TextVariantName = "line-wipe";

export type Playlist = {
  slug: string;
  images: string[]; // paths relative to the playlist's out dir
  text: TextVariantName;
  morph: string | null; // path relative to the out dir, or null
};

export function seedPlaylist(slug: string, images: string[]): Playlist {
  return { slug, images, text: DEFAULT_TEXT, morph: null };
}

// Re-capture is non-destructive: append only newly-captured images, never
// reorder or drop the user's curated list / text / morph picks.
export function mergePlaylist(existing: Playlist, captured: string[]): Playlist {
  const have = new Set(existing.images);
  const appended = captured.filter((p) => !have.has(p));
  return { ...existing, images: [...existing.images, ...appended] };
}

// Returns the list of referenced files that do not exist on disk.
export function validatePlaylist(p: Playlist, outDir: string): string[] {
  const missing: string[] = [];
  for (const img of p.images) if (!existsSync(join(outDir, img))) missing.push(img);
  if (p.morph && !existsSync(join(outDir, p.morph))) missing.push(p.morph);
  return missing;
}

export function loadPlaylist(outDir: string): Playlist {
  const file = join(outDir, "video.json");
  if (!existsSync(file)) {
    throw new Error(`No playlist at ${file}. Run \`assets:images <slug>\` first.`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as Playlist;
}
