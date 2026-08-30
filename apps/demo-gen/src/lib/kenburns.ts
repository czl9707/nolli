// Stills are fully static — no zoom, no pan, no crossfade. Hard cuts only.
export function kenBurns(_frame: number, _durationInFrames: number) {
  return { scale: 1, x: 0, y: 0, opacity: 1 };
}
