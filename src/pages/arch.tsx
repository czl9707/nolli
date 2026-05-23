import { H1 } from "@/components/ui/typography"
import { PortfolioItem } from "@/components/layout/portfolio-item"

export function ArchContent() {
  return (
    <>
      <PortfolioItem delay={0.6}>
        <H1>{"Seagram Building"}</H1>
      </PortfolioItem>
      <PortfolioItem delay={0.8}>
        <H1>{"Seagram Building"}</H1>
      </PortfolioItem>
      <PortfolioItem delay={1.0}>
        <H1>{"Seagram Building"}</H1>
      </PortfolioItem>
      <PortfolioItem delay={1.2}>
        <H1>{"Seagram Building"}</H1>
      </PortfolioItem>
    </>
  )
}
