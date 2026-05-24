import type { ArchLinks } from "@/lib/data/architectures"
import { PortfolioShell } from "@/components/layout/portfolio-shell"
import { Body1, Body2, H6 } from "@/components/ui/typography"
import styles from "./portfolio-links.module.css"

type PortfolioLinksProps = {
  links: ArchLinks
  index: number
  total: number
}

type LinkEntry = {
  url: string
  label: string
}

function collectLinks(links: ArchLinks): LinkEntry[] {
  const entries: LinkEntry[] = []
  entries.push({ url: links.googleMaps, label: "Google Maps" })
  if (links.wikipedia) {
    entries.push({ url: links.wikipedia, label: "Wikipedia" })
  }
  if (links.archdaily) {
    entries.push({ url: links.archdaily, label: "ArchDaily" })
  }
  if (links.custom) {
    entries.push(...links.custom)
  }
  return entries
}

export function PortfolioLinks({ links, index, total }: PortfolioLinksProps) {
  const entries = collectLinks(links)

  return (
    <PortfolioShell className={styles.container} index={index} total={total}>
      <H6 className={styles.heading}>External References</H6>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.url}>
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              >
              <Body2>{entry.label}</Body2>
            </a>
          </li>
        ))}
      </ul>
    </PortfolioShell>
  )
}
