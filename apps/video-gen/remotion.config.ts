import { defineRemotionConfig } from "@nolli/remotion/config";

// ANGLE: the reel renders MapLibre (WebGL) headlessly.
defineRemotionConfig({ openGlRenderer: "angle" });
