import { PortfolioItem } from "@/components/layout/portfolio-item"
import { useSelectedArch } from "@/contexts/selected-arch"

export function ArchContent() {
  const { arch } = useSelectedArch()

  if (!arch) return null

  return (
    <>
      {arch.pages.map((page, i) => (
        <PortfolioItem
          key={i}
          page={page}
          index={i}
          total={arch.pages.length}
          delay={0.6 + i * 0.2}
        />
      ))}
    </>
  )
}
