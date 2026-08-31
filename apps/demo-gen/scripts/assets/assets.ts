// Umbrella: capture every asset for one slug — still photos, then the map-journey
// demo. Equivalent to `assets:images <slug>` followed by `assets:demo <slug>`.
// Each step is also runnable on its own for partial runs.
import { runCli } from "@nolli/remotion/cli";
import { runImages } from "./assets-images";
import { runDemo } from "./assets-demo";

// Top-level runCli: this module is never imported by another script.
runCli("assets", async (slug) => {
  console.log(`assets — ${slug} (images and demo)`);
  await runImages(slug);
  await runDemo(slug);
  console.log(`assets — ${slug} done.`);
});
