// Node-only script utilities, imported via the "@nolli/remotion/cli" subpath
// from the apps' scripts/ — never re-exported from the package barrel, so
// Remotion's bundler (which starts at src/index.ts) never sees Node APIs.
import { existsSync, readFileSync } from "node:fs";

export type CliFlags = { fresh?: boolean };

/** Run a script's main: usage-error on a missing slug, parse --fresh, and
 *  exit(1) with the error on failure. Call at module top level (the script's
 *  own entry) — modules that are imported by other scripts must keep an
 *  import.meta.filename guard around the call. */
export function runCli(
  name: string,
  fn: (slug: string, flags: CliFlags) => Promise<void>,
): void {
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) throw new Error(`Usage: ${name} <architect-slug> [--fresh]`);
  const fresh = process.argv.includes("--fresh");
  fn(slug, { fresh }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

/** Remotion's bundled Headless Shell download is SSL-blocked in this
 *  environment; fall back to a system browser. */
export function browserExecutable(): string {
  const found =
    process.env.REMOTION_BROWSER_EXECUTABLE ??
    ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) =>
      existsSync(p),
    );
  if (!found) throw new Error("No system Chrome/Chromium found. Set REMOTION_BROWSER_EXECUTABLE.");
  return found;
}

/** Read + parse a JSON config, or throw a canonical message naming the next
 *  command to run (`hint`, e.g. "Run seed first."). */
export function readJsonOr<T>(path: string, hint: string): T {
  if (!existsSync(path)) throw new Error(`No file at ${path}. ${hint}`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    throw new Error(`Malformed JSON at ${path}. ${hint}`);
  }
}
