// apps/video-gen/src/lib/use-theme-pin.ts
import { useThemeStore } from "@nolli/ui/theme";
import type { ReelTheme } from "./theme";

/** Pin the @nolli/ui theme store and the document's color-scheme to the
 *  reel's theme. Called from the composition's render body (before children
 *  mount) — the store must hold the theme before any theme-conditional asset
 *  or media-query-driven SVG resolves. Idempotent: re-pinning the same value
 *  is a no-op for subscribers. */
export function useThemePin(theme: ReelTheme): void {
  useThemeStore.setState({ theme, resolvedTheme: theme });
  if (typeof document !== "undefined") {
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
}
