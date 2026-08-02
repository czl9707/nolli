import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Playlist = {
  slug: string;
  images: string[]; // paths relative to the playlist's out dir
  morph: string | null; // path relative to the out dir, or null
};

export function seedPlaylist(slug: string, images: string[]): Playlist {
  return { slug, images, morph: null };
}

export function mergePlaylist(existing: Playlist, captured: string[]): Playlist {
  const have = new Set(existing.images);
  const appended = captured.filter((p) => !have.has(p));
  return { ...existing, images: [...existing.images, ...appended] };
}

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
