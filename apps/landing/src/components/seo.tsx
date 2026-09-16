import { useEffect } from "react"
import { LANDING_URL } from "@/lib/constants"

interface SeoProps {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.rel = "canonical"
    document.head.appendChild(el)
  }
  el.href = href
}

function Seo({
  title,
  description,
  path = "/",
  type = "website",
}: SeoProps) {
  const fullTitle = title === "Nolli" ? "Nolli" : `${title} | Nolli`
  const url = `${LANDING_URL}${path}`

  useEffect(() => {
    document.title = fullTitle
    upsertMeta("name", "description", description)
    upsertMeta("property", "og:title", title)
    upsertMeta("property", "og:description", description)
    upsertMeta("property", "og:type", type)
    upsertMeta("property", "og:url", url)
    upsertMeta("property", "og:site_name", "Nolli")
    upsertMeta("name", "twitter:card", "summary")
    upsertMeta("name", "twitter:title", title)
    upsertMeta("name", "twitter:description", description)
    upsertCanonical(url)
  }, [fullTitle, title, description, type, url])

  return null
}

export { Seo }
export type { SeoProps }
