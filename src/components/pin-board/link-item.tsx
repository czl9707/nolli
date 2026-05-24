import type { ArchLinks } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import { ExternalLink } from "lucide-react"
import styles from "./link-item.module.css"

type LinkItemProps = {
  links: ArchLinks
  item: PlacedItem
  delay: number
}

type LinkEntry = {
  url: string
  label: string
}

function collectLinks(links: ArchLinks): LinkEntry[] {
  const entries: LinkEntry[] = []
  entries.push({ url: links.googleMaps, label: "Google Maps" })
  if (links.wikipedia) entries.push({ url: links.wikipedia, label: "Wikipedia" })
  if (links.archdaily) entries.push({ url: links.archdaily, label: "ArchDaily" })
  if (links.custom) entries.push(...links.custom)
  return entries
}

export function LinkItem({ links, item, delay }: LinkItemProps) {
  const entries = collectLinks(links)
  return (
    <BoardItem item={item} delay={delay}>
      <div className={styles.card}>
        {entries.map((entry) => (
          <a
            key={entry.url}
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <ExternalLink size={12} className={styles.icon} />
            {entry.label}
          </a>
        ))}
      </div>
    </BoardItem>
  )
}
