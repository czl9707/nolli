import { OUTRO, LOGO_WORD, STILL_FRAMES } from "./constants";

// Frames a segment runs: entrance beat + (reveal window) + hold + exit.
// Independent of text length — empty text skips the reveal window. The logo is
// the final lockup and passes exit=false so it holds instead of wiping out.
export function segmentDuration(textLen: number, typeStart: number, exit = false): number {
  const typed = textLen <= 0 ? 0 : OUTRO.typeFrames;
  return typeStart + typed + OUTRO.hold + (exit ? OUTRO.exitFrames : 0);
}

// Frame at which a segment's exit wipe begins (entrance + reveal + hold).
export function exitStartFrame(typeStart: number): number {
  return typeStart + OUTRO.typeFrames + OUTRO.hold;
}

export type FontVariant = "sans" | "playful";
export type ColorToken = "fg" | "fgSecondary";

export type TextScene = { type: "text"; text: string; size?: number; color?: ColorToken };
export type ImageScene = { type: "image"; src: string };
export type VideoScene = {
  type: "video";
  src: string;
  playbackRate?: number;
  /** Native (pre-speedup) frame count, filled by assemble via ffprobe. */
  frames?: number;
};
export type LogoScene = { type: "logo" };

export type Scene = TextScene | ImageScene | VideoScene | LogoScene;

export type VideoConfig = {
  slug: string;
  fontVariant?: FontVariant;
  scenes: Scene[];
};

export const DEFAULT_TEXT_SIZE = 104;
export const DEFAULT_PLAYBACK_RATE = 1;
export const DEFAULT_FONT_VARIANT: FontVariant = "playful";

export function durationOf(scene: Scene): number {
  switch (scene.type) {
    case "text":
      // Text cards start revealing on frame 0 (no entrance beat).
      return segmentDuration(scene.text.length, 0, true);
    case "image":
      return STILL_FRAMES;
    case "video":
      if (scene.frames === undefined) {
        throw new Error(`video scene "${scene.src}" has no frame count — run \`pnpm assemble\` first.`);
      }
      // One frame short of the clip's scaled length: the composition's final
      // frames seek to the clip's literal last decodable frame, and the
      // extractor can land just past it (black flash). Staying a frame inside
      // is invisible at 30fps and keeps the tail clean.
      return Math.max(1, Math.ceil(scene.frames / (scene.playbackRate ?? DEFAULT_PLAYBACK_RATE)) - 1);
    case "logo":
      return segmentDuration(LOGO_WORD.length, OUTRO.logo.typeStart);
  }
}

export function totalDuration(scenes: readonly Scene[]): number {
  return scenes.reduce((sum, s) => sum + durationOf(s), 0);
}
