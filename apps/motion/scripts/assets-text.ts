import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { TEXT_VARIANTS } from "./playlist";
import type { Manifest } from "./manifest";

async function main() {
  const slug = process.argv[2] ?? "sanaa";
  const fontVariant = "playful";
  const outDir = resolve("out", slug);
  mkdirSync(outDir, { recursive: true });

  const manifestPath = resolve(outDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });

  for (const variant of TEXT_VARIANTS) {
    const inputProps = { manifest, fontVariant, textVariant: variant };
    const composition = await selectComposition({
      serveUrl,
      id: "Scene3Text",
      inputProps,
    });
    const out = resolve(outDir, `text-${variant}.mp4`);
    console.log(`Rendering ${variant} → ${out}`);
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out });
  }
  console.log("Done. Review the three clips and set `text` in out/<slug>/video.json.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
