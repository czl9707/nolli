import { Config } from "@remotion/cli/config";
import { defineRemotionConfig } from "@nolli/remotion/config";

// ANGLE: the reel renders MapLibre (WebGL) headlessly.
defineRemotionConfig(Config, { openGlRenderer: "angle", publicPatterns: true });
