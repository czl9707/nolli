import { H1 } from "@/components/ui/typography"
import { PortfolioItem } from "@/components/layout/portfolio-item"
import { useSelectedArch } from "@/contexts/selected-arch"

export function ArchContent() {
  const { arch } = useSelectedArch()

  return (
    <>
      <PortfolioItem delay={0.6}>
        <H1>{arch?.name ?? ""}</H1>
      </PortfolioItem>
      <PortfolioItem delay={0.8}>
        <H1>{arch?.author ?? ""}</H1>
      </PortfolioItem>
      <PortfolioItem delay={1.0}>
        <H1>{arch?.year ?? ""}</H1>
      </PortfolioItem>
      <PortfolioItem delay={1.2}>
        <H1>{arch?.address ?? ""}</H1>
      </PortfolioItem>
    </>
  )
}
