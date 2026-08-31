// Per-app remotion.config.ts helper, imported via the "@nolli/remotion/config"
// subpath. Evaluated for side effects by the Remotion CLI — NEVER re-exported
// from the package barrel (index.ts is bundled into the browser).
import { Config } from "@remotion/cli/config";

/** Common Remotion config for the video apps: jpeg frames, overwrite, and the
 *  webpack asset-emission fix. `openGlRenderer: "angle"` opts in to ANGLE for
 *  compositions that render MapLibre (WebGL) headlessly. */
export function defineRemotionConfig(opts: { openGlRenderer?: "angle" } = {}): void {
  Config.setVideoImageFormat("jpeg");
  Config.setOverwriteOutput(true);
  if (opts.openGlRenderer) Config.setChromiumOpenGlRenderer(opts.openGlRenderer);

  // Remotion's dev bundle emits assets under their source path
  // ("[path][name][ext]"), which turns the @fontsource woff2 references from
  // @nolli/ui/global.css into /node_modules/.pnpm/... URLs the Studio dev
  // server doesn't serve (they come back as the SPA page). Match the
  // production emission ("[hash][ext]") so the CSS font chain loads in
  // Studio too — no local font copies needed.
  Config.overrideWebpackConfig((config) => ({
    ...config,
    output: {
      ...config.output,
      assetModuleFilename: "[hash][ext]",
    },
  }));
}
