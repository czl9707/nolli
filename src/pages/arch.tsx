import { PortfolioItem } from "@/components/layout/portfolio-item"
import { PortfolioLinks } from "@/components/layout/portfolio-links"
import { useSelectedArch } from "@/contexts/selected-arch"

export function ArchContent() {
  const { lastSelectedArch } = useSelectedArch()

  if (!lastSelectedArch) return null

  const totalPages = lastSelectedArch.pages.length + 1

  return (
    <>
      {lastSelectedArch.pages.map((page, i) => (
        <PortfolioItem
          key={i}
          page={page}
          index={i}
          total={totalPages}
        />
      ))}
      <PortfolioLinks
        links={lastSelectedArch.links}
        index={lastSelectedArch.pages.length}
        total={totalPages}
      />
    </>
  )
}
