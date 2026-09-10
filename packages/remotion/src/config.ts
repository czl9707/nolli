// Per-app remotion.config.ts helper, imported via the "@nolli/remotion/config"
// subpath. Evaluated for side effects by the Remotion CLI — NEVER re-exported
// from the package barrel (index.ts is bundled into the browser).
//
// The caller's own Config instance MUST be passed in: pnpm can materialize
// two @remotion/cli copies (peer typescript version splits), and a Config
// imported here registers overrides on the wrong singleton — silently.
import { resolve } from "node:path";

type RemotionConfig = typeof import("@remotion/cli/config").Config;

/** Common Remotion config for the video apps: jpeg frames, overwrite, and the
 *  webpack asset-emission fix. `openGlRenderer: "angle"` opts in to ANGLE for
 *  compositions that render MapLibre (WebGL) headlessly. `publicPatterns:
 *  true` aliases the `/patterns/...` CSS urls from @nolli/ui's paper texture
 *  to the app's public dir (webpack can't see public/, vite serves it).
 *  Both paths alias the app's tsconfig `@/*` → `src/*`. */
export function defineRemotionConfig(
  config: RemotionConfig,
  opts: { openGlRenderer?: "angle"; publicPatterns?: boolean } = {},
): void {
  config.setVideoImageFormat("jpeg");
  config.setOverwriteOutput(true);
  if (opts.openGlRenderer) config.setChromiumOpenGlRenderer(opts.openGlRenderer);

  // Remotion's dev bundle emits assets under their source path
  // ("[path][name][ext]"), which turns the @fontsource woff2 references from
  // @nolli/ui/global.css into /node_modules/.pnpm/... URLs the Studio dev
  // server doesn't serve (they come back as the SPA page). Match the
  // production emission ("[hash][ext]") so the CSS font chain loads in
  // Studio too — no local font copies needed.
  config.overrideWebpackConfig((webpackConfig) => ({
    ...webpackConfig,
    output: {
      ...webpackConfig.output,
      assetModuleFilename: "[hash][ext]",
    },
    resolve: {
      ...webpackConfig.resolve,
      alias: {
        ...(webpackConfig.resolve?.alias as Record<string, string> | undefined),
        "@": resolve(process.cwd(), "src"),
        ...(opts.publicPatterns
          ? { "/patterns": resolve(process.cwd(), "public", "patterns") }
          : {}),
      },
    },
  }));
}
