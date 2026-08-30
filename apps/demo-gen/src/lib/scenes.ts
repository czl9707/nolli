import { STILL_FRAMES, scene2Duration } from "./timing";
import { OUTRO, segmentDuration, LOGO_WORD } from "./outro";
// Text cards animate out before the cut; the logo is the final lockup, so it
// holds (exit = false).

export type FontVariant = "inter" | "playful";
export type ColorToken = "fg" | "fgSecondary";

export type TextScene = { type: "text"; text: string; size?: number; color?: ColorToken };
export type ImageScene = { type: "image"; src: string };
export type VideoScene = {
  type: "video";
  src: string;
  playbackRate?: number;
  endStill?: string;
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

export function durationOf(scene: Scene): number {
  switch (scene.type) {
    case "text":
      // Text cards start revealing on frame 0 (no entrance beat).
      return segmentDuration(scene.text.length, 0, true);
    case "image":
      return STILL_FRAMES;
    case "video":
      return Math.ceil(
        (scene.frames ?? scene2Duration) / (scene.playbackRate ?? DEFAULT_PLAYBACK_RATE),
      );
    case "logo":
      return segmentDuration(LOGO_WORD.length, OUTRO.logo.typeStart);
  }
}

export function totalDuration(scenes: readonly Scene[]): number {
  return scenes.reduce((sum, s) => sum + durationOf(s), 0);
}
