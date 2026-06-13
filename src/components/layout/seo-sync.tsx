import { useLocation } from "react-router"
import { Seo } from "@/components/seo"

const HOME_DESCRIPTION =
  "A map built for architectures."

const ABOUT_DESCRIPTION =
  "Nolli helps architects discover and study buildings through an interactive map experience."

export function SeoSync() {
  const location = useLocation()
  const { pathname } = location

  if (pathname.startsWith("/about")) {
    return <Seo title="About" description={ABOUT_DESCRIPTION} path="/about" />
  }

  // Default: home (covers "/" and "/arch/*" routes)
  return <Seo title="Nolli" description={HOME_DESCRIPTION} path="/" />
}
