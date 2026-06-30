import { Helmet } from "react-helmet-async"

const SITE_URL = "https://nolli-map.com"

interface SeoProps {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
}

function Seo({
  title,
  description,
  path = "/",
  type = "website",
}: SeoProps) {
  const fullTitle = title === "Nolli" ? "Nolli" : `${title} | Nolli`
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Nolli" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={url} />
    </Helmet>
  )
}

export { Seo }
export type { SeoProps }
