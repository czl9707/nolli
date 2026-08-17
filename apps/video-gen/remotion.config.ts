import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");

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
