// Architect registry: slug -> { display name (as stored in the DB), hero building }.
// The DB stores architects by display name; this bridges the lowercase slug used
// in commands/URLs to that name, and designates each architect's hero building
// (the morph origin). Buildings themselves come from the sqlite query in db.ts.
// Side-effect-free so it can be imported by the asset scripts without running a
// manifest build.
export const ARCHITECTS: Record<string, { name: string; hero?: string }> = {
  sanaa: { name: "SANAA", hero: "rolex-learning-center" },
};
