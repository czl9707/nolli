import { useLocation } from "react-router"
import { Seo } from "@/components/seo"

const HOME_DESCRIPTION = "A map built for architectures."

export function SeoSync() {
  const { pathname } = useLocation()

  // /about and /privacy render their own <Seo>; yield there to avoid duplicate tags.
  if (pathname.startsWith("/about") || pathname.startsWith("/privacy")) {
    return null
  }

  // Default: home (covers "/" and "/arch/*" routes)
  return <Seo title="Nolli" description={HOME_DESCRIPTION} path="/" />
}
