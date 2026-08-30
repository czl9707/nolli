// Umbrella: capture every asset for one slug — still photos, then the map-journey
// demo. Equivalent to `assets:images <slug>` followed by `assets:demo <slug>`.
// Each step is also runnable on its own for partial runs.
import { runImages } from "./assets-images";
import { runDemo } from "./assets-demo";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: assets <architect-slug>");
    process.exit(1);
  }
  console.log(`assets — ${slug} (images, then demo)`);
  await runImages(slug);
  await runDemo(slug);
  console.log(`assets — ${slug} done.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
