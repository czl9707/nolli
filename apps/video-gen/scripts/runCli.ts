export type CliFlags = { fresh?: boolean };

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
