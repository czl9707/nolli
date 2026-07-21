// URL-safe slug: lowercase, strip diacritics, runs of non-alphanumerics → "-".
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  )
}

// Google Maps search URL from a place name + city + country. Matches the
// `googleMapsUrl` format used by the seed data in scripts/_data — a `?q=`
// place query, not a raw lat/lng pair, so the pin lands on the architecture, not
// the coordinate centroid.
export function buildGoogleMapsUrl(m: {
  name: string
  city: string
  country: string
}): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    `${m.name}, ${m.city}, ${m.country}`
  )}`
}
