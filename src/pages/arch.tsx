import { PortfolioItem } from "@/components/layout/portfolio-item"
import { useSelectedArch } from "@/contexts/selected-arch"

export function ArchContent() {
  const { lastSelectedArch } = useSelectedArch()

  if (!lastSelectedArch) return null

  return (
    <>
      {lastSelectedArch.pages.map((page, i) => (
        <PortfolioItem
          key={i}
          page={page}
          index={i}
          total={lastSelectedArch.pages.length}
        />
      ))}
    </>
  )
}
