import type { PlacedArchItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import { ExternalLink } from "lucide-react"
import styles from "./link-item.module.css"
import { Body1 } from "../ui/typography"

type LinkEntry = {
  url: string
  label: string
}

type LinkItemProps = Extract<PlacedArchItem, { kind: "links" }> & {
  delay: number
}

function collectLinks(links: LinkItemProps["links"]): LinkEntry[] {
  const entries: LinkEntry[] = []
  entries.push({ url: links.googleMaps, label: "Google Maps" })
  if (links.wikipedia)
    entries.push({ url: links.wikipedia, label: "Wikipedia" })
  if (links.archdaily)
    entries.push({ url: links.archdaily, label: "ArchDaily" })
  if (links.custom) entries.push(...links.custom)
  return entries
}

export function LinkItem({ links, position, delay }: LinkItemProps) {
  const entries = collectLinks(links)

  return (
    <BoardItem
      id="links"
      position={position}
      delay={delay}
      className={styles.linkWrapper}
    >
      {entries.map((entry) => (
        <a
          key={entry.url}
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          <ExternalLink size={12} className={styles.icon} />
          <Body1 className={styles.label}>{entry.label}</Body1>
        </a>
      ))}
    </BoardItem>
  )
}
