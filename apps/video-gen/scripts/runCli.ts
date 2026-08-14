/** argv[2] + error-exit harness shared by the seed/assets/render CLIs. */
export function runCli(name: string, fn: (slug: string) => Promise<void>): void {
  const slug = process.argv[2];
  if (!slug) throw new Error(`Usage: ${name} <architect-slug>`);
  fn(slug).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
