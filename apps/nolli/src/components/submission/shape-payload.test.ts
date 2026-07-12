import { describe, it, expect, vi } from "vitest"
import { submissionPayloadSchema } from "@nolli/data"
import {
  shapePayload,
  payloadToFormValues,
  resolvePhotos,
  classifyLinkType,
  type ResolvedFormValues,
} from "./shape-payload"

// shapePayload consumes ResolvedFormValues (photos already carry a staging_key).
const baseForm: ResolvedFormValues = {
  metadata: {
    name: "Villa Savoye",
    architect: "Le Corbusier",
    year: 1931,
    address: "Poissy",
    city: "Poissy",
    country: "France",
    latitude: 48.9,
    longitude: 2.03,
    google_maps_url: "",
  },
  photos: [
    { staging_key: "k1", width: 1000, height: 800, caption: "front" },
    { staging_key: "k2", width: 500, height: 500, caption: "" },
  ],
  notes: [{ text: "Five points of architecture." }],
  links: [{ label: "Wiki", url: "https://en.wikipedia.org/wiki/Villa_Savoye" }],
}

describe("shapePayload", () => {
  it("marks every item action:'new' and sets id null", () => {
    const p = shapePayload(baseForm)
    expect(p.photos.every((ph) => ph.action === "new" && ph.id === null)).toBe(true)
    expect(p.notes.every((n) => n.action === "new" && n.id === null)).toBe(true)
    expect(p.links.every((l) => l.action === "new" && l.id === null)).toBe(true)
  })

  it("sets is_cover true only on the first photo", () => {
    const p = shapePayload(baseForm)
    expect(p.photos.map((ph) => ph.is_cover)).toEqual([true, false])
  })

  it("derives google_maps_url from name/city/country when blank", () => {
    const p = shapePayload(baseForm)
    expect(p.metadata.google_maps_url).toBe(
      "https://www.google.com/maps?q=Villa%20Savoye%2C%20Poissy%2C%20France",
    )
  })

  it("keeps an explicit google_maps_url", () => {
    const p = shapePayload({
      ...baseForm,
      metadata: { ...baseForm.metadata, google_maps_url: "https://maps.example/x" },
    })
    expect(p.metadata.google_maps_url).toBe("https://maps.example/x")
  })

  it("derives links sort_order from array index and types them custom", () => {
    const p = shapePayload({
      ...baseForm,
      links: [
        { label: "a", url: "https://a.example" },
        { label: "", url: "https://b.example" },
      ],
    })
    expect(p.links.map((l) => l.sort_order)).toEqual([0, 1])
    expect(p.links.every((l) => l.type === "custom")).toBe(true)
    expect(p.links[1].label).toBe(null) // blank label → null
  })

  it("classifies link type from url and defaults blank labels for known sources", () => {
    const p = shapePayload({
      ...baseForm,
      links: [
        { label: "", url: "https://en.wikipedia.org/wiki/Villa_Savoye" },
        { label: "", url: "https://www.archdaily.com/1/x" },
        { label: "", url: "https://example.com" },
        { label: "My Link", url: "https://en.wikipedia.org/wiki/Y" },
      ],
    })
    expect(p.links.map((l) => l.type)).toEqual(["wikipedia", "archdaily", "custom", "wikipedia"])
    expect(p.links[0].label).toBe("Wikipedia") // blank → type default
    expect(p.links[1].label).toBe("ArchDaily") // blank → type default
    expect(p.links[2].label).toBe(null) // custom + blank → null (URL fallback downstream)
    expect(p.links[3].label).toBe("My Link") // explicit label preserved
  })

  it("round-trips through submissionPayloadSchema", () => {
    const p = shapePayload(baseForm)
    expect(() => submissionPayloadSchema.parse(p)).not.toThrow()
  })

  it("payloadToFormValues inverts shapePayload (photos become 'existing')", () => {
    const round = payloadToFormValues(shapePayload(baseForm))
    expect(round).toEqual({
      ...baseForm,
      metadata: {
        ...baseForm.metadata,
        google_maps_url: "https://www.google.com/maps?q=Villa%20Savoye%2C%20Poissy%2C%20France",
      },
      photos: baseForm.photos.map((p) => ({ kind: "existing", ...p })),
    })
  })
})

describe("classifyLinkType", () => {
  it("classifies wikipedia hosts (incl. subdomains and bare apex)", () => {
    expect(classifyLinkType("https://en.wikipedia.org/wiki/Villa_Savoye")).toBe("wikipedia")
    expect(classifyLinkType("https://wikipedia.org/wiki/X")).toBe("wikipedia")
  })
  it("classifies archdaily hosts (incl. www)", () => {
    expect(classifyLinkType("https://www.archdaily.com/123/x")).toBe("archdaily")
    expect(classifyLinkType("https://archdaily.com/")).toBe("archdaily")
  })
  it("does not match lookalike hosts", () => {
    expect(classifyLinkType("https://notarchdaily.com/x")).toBe("custom")
    expect(classifyLinkType("https://fakewikipedia.org/")).toBe("custom")
  })
  it("falls back to custom for unknown hosts", () => {
    expect(classifyLinkType("https://example.com")).toBe("custom")
  })
  it("falls back to custom for unparseable urls", () => {
    expect(classifyLinkType("not-a-url")).toBe("custom")
  })
})

describe("resolvePhotos", () => {
  it("passes 'existing' photos through without uploading", async () => {
    const upload = vi.fn()
    const photos = [
      { kind: "existing", staging_key: "k1", width: 1, height: 2, caption: "a" },
    ] as const
    const resolved = await resolvePhotos([...photos], upload)
    expect(upload).not.toHaveBeenCalled()
    expect(resolved).toEqual([{ staging_key: "k1", width: 1, height: 2, caption: "a" }])
  })

  it("uploads 'new' photos and stitches in the returned staging_key", async () => {
    const file = new File(["x"], "photo.jpg")
    const upload = vi.fn(async () => ({ staging_key: "uploaded" }))
    const resolved = await resolvePhotos(
      [{ kind: "new", file, width: 10, height: 20, caption: "" }],
      upload,
    )
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload).toHaveBeenCalledWith(file)
    expect(resolved).toEqual([{ staging_key: "uploaded", width: 10, height: 20, caption: "" }])
  })

  it("preserves order across a mix of new and existing", async () => {
    const f1 = new File(["1"], "a.jpg")
    const f3 = new File(["3"], "c.jpg")
    const upload = vi.fn(async (file: File) => ({ staging_key: `up-${file.name}` }))
    const resolved = await resolvePhotos(
      [
        { kind: "new", file: f1, width: 1, height: 1, caption: "" },
        { kind: "existing", staging_key: "k", width: 2, height: 2, caption: "e" },
        { kind: "new", file: f3, width: 3, height: 3, caption: "n" },
      ],
      upload,
    )
    expect(resolved.map((r) => r.staging_key)).toEqual(["up-a.jpg", "k", "up-c.jpg"])
    expect(resolved.map((r) => r.caption)).toEqual(["", "e", "n"])
  })

  it("throws on the first upload failure", async () => {
    const file = new File(["x"], "bad.jpg")
    const upload = vi.fn().mockRejectedValue(new Error("boom"))
    await expect(
      resolvePhotos([{ kind: "new", file, width: 1, height: 1, caption: "" }], upload),
    ).rejects.toThrow("boom")
  })
})
