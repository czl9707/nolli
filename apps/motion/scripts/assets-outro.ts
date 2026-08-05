import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { Manifest } from "./manifest";
import { countText, NOW_TEXT } from "../src/lib/outro";
import type { TextScene } from "../src/lib/scenes";

type Seg =
  | { id: "OutroText"; file: string; scene: TextScene }
  | { id: "OutroLogo"; file: string };

function segments(manifest: Manifest): Seg[] {
  return [
    { id: "OutroText", file: "outro-name.mp4", scene: { type: "text", text: manifest.architect, size: 132, color: "fg" } },
    { id: "OutroText", file: "outro-count.mp4", scene: { type: "text", text: countText(manifest.count), size: 104, color: "fg" } },
    { id: "OutroText", file: "outro-now.mp4", scene: { type: "text", text: NOW_TEXT, size: 104, color: "fg" } },
    { id: "OutroLogo", file: "outro-logo.mp4" },
  ];
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: assets:outro <architect-slug>");
    process.exit(1);
  }
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

  for (const seg of segments(manifest)) {
    const inputProps =
      seg.id === "OutroText"
        ? { scene: seg.scene, fontVariant }
        : { fontVariant };
    const composition = await selectComposition({ serveUrl, id: seg.id, inputProps });
    const out = resolve(outDir, seg.file);
    console.log(`Rendering ${seg.id} → ${out}`);
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out });
  }
  console.log(`Done. 4 outro clips written to out/${slug}/.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
