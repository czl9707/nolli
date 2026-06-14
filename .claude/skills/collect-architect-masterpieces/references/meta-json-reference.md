# Seed Data: meta.json Reference

Shape consumed by `scripts/seed-architectures.ts`.

## Directory structure

```
scripts/data/
└── {slug}/
    ├── meta.json
    ├── photo-01.jpg
    ├── photo-02.png
    └── ...
```

Each subdirectory of `scripts/data/` is treated as one architecture. The directory name becomes the slug.

## meta.json

```json
{
  "name": "Villa Savoye",
  "architect": "Le Corbusier",
  "architectCountry": "France",
  "year": 1929,
  "address": "82 Rue de Villiers, Poissy",
  "city": "Poissy",
  "country": "FR",
  "latitude": 48.9263,
  "longitude": 2.0327,
  "googleMapsUrl": "https://maps.google.com/...",
  "coverImage": "photo-01.jpg",
  "notes": [
    "A defining work of modernist architecture.",
    "Declared a UNESCO World Heritage Site in 2016."
  ],
  "links": [
    { "type": "wikipedia", "url": "https://en.wikipedia.org/wiki/Villa_Savoye", "label": "Wikipedia" },
    { "type": "custom", "url": "https://www.archdaily.com/...", "label": "ArchDaily" }
  ]
}
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name |
| `architect` | string | yes | Architect name. Looked up or created in `architects` table |
| `architectCountry` | string | yes | Country the architect is associated with. Looked up or created by name |
| `year` | number | yes | Year built or completed |
| `address` | string | yes | Street address |
| `city` | string | yes | City name. Looked up or created (scoped to country) |
| `country` | string | yes | ISO country code (e.g. `FR`, `JP`). Looked up or created |
| `latitude` | number | yes | Decimal degrees |
| `longitude` | number | yes | Decimal degrees |
| `googleMapsUrl` | string | yes | Google Maps link |
| `coverImage` | string | no | Filename of the cover photo. Defaults to the first image file |
| `notes` | string[] | no | Free-text notes |
| `links` | Link[] | no | External links |

### Link

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | One of `wikipedia`, `archdaily`, `custom` |
| `url` | string | yes | Full URL |
| `label` | string | yes | Display label |

## Images

All non-`meta.json` files in the slug directory with an image extension (`jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`) are uploaded. Image dimensions (`width`, `height`) are read automatically with Sharp.

Files are uploaded to S3 at `architectures/{slug}/{sha256-hash}.{ext}`. Re-running the script skips uploads for unchanged files.
