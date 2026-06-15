import { Seo } from "@/components/seo"
import { useLayout } from "@/hooks/use-layout"

const HOME_DESCRIPTION = "A map built for architectures."

export function SeoSync() {
  const { isStatic } = useLayout()

  // /about and /privacy render their own <Seo>; yield there to avoid duplicate tags.
  if (isStatic) return null

  // Default: home (covers "/" and "/arch/*" routes)
  return <Seo title="Nolli" description={HOME_DESCRIPTION} path="/" />
}
