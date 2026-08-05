import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Playlist = {
  slug: string;
  detail: string[]; // *-detail.png paths relative to the out dir (batch 1)
  board: string[]; // *-board.png paths relative to the out dir (batch 2)
  journey: { hero: string; far: string }; // building slugs the Scene 2 morph flies between
  morph: string | null; // path relative to the out dir, or null until assets:morph runs
};

export function seedPlaylist(
  slug: string,
  detail: string[],
  board: string[],
  journey: { hero: string; far: string },
): Playlist {
  return { slug, detail, board, journey, morph: null };
}

// Non-destructive refresh on rerun: dedupe+append each list separately, preserve
// a hand-edited journey/morph/slug.
export function mergePlaylist(
  existing: Playlist,
  capturedDetail: string[],
  capturedBoard: string[],
): Playlist {
  const merge = (list: string[], add: string[]) => {
    const have = new Set(list);
    return [...list, ...add.filter((p) => !have.has(p))];
  };
  return {
    ...existing,
    detail: merge(existing.detail, capturedDetail),
    board: merge(existing.board, capturedBoard),
  };
}

export function validatePlaylist(p: Playlist, outDir: string): string[] {
  const missing: string[] = [];
  for (const img of [...p.detail, ...p.board]) if (!existsSync(join(outDir, img))) missing.push(img);
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
