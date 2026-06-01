export const SQL_GET_ALL_ARCHITECTURES = `
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
JOIN cities ci ON a.city_id = ci.id
JOIN countries c ON ci.country_id = c.id
`

export const SQL_GET_ARCH_BY_SLUG = `
SELECT a.slug, a.name, a.year, a.address, a.latitude, a.longitude,
       a.google_maps_url,
       arch.name AS architect,
       ci.name AS city,
       c.code AS country_code
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN cities ci ON a.city_id = ci.id
LEFT JOIN countries c ON ci.country_id = c.id
WHERE a.slug = ?
`

export const SQL_GET_PHOTOS = `
SELECT image, caption, width, height, is_cover
FROM architecture_photos
WHERE architecture_id = ?
ORDER BY is_cover DESC
`

export const SQL_GET_NOTES = `
SELECT text
FROM architecture_notes
WHERE architecture_id = ?
`

export const SQL_GET_LINKS = `
SELECT type, url, label, sort_order
FROM architecture_links
WHERE architecture_id = ?
ORDER BY sort_order
`

export const SQL_SEARCH_ARCHITECTURES = `
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
WHERE a.name LIKE '%' || ? || '%'
   OR arch.name LIKE '%' || ? || '%'
   OR a.address LIKE '%' || ? || '%'
ORDER BY a.name
`

export const SQL_GET_ARCHITECTS = `
SELECT id, name FROM architects ORDER BY name
`

export const SQL_GET_CITIES = `
SELECT ci.id, ci.name, c.code AS country_code
FROM cities ci
JOIN countries c ON ci.country_id = c.id
ORDER BY ci.name
`

export const SQL_GET_COUNTRIES = `
SELECT code, name FROM countries ORDER BY name
`

export const SQL_GET_ARCHITECTURE_ID_BY_SLUG = `
SELECT id FROM architectures WHERE slug = ?
`
