import type { PlacedArchItem } from "@/lib/pin-board-layout"
import { MetadataItem } from "./metadata-item"
import { PhotoItem } from "./photo-item"
import { NoteItem } from "./note-item"
import { LinkItem } from "./link-item"

export function PinBoardItem({
  item,
  delay,
}: {
  item: PlacedArchItem
  delay: number
}) {
  switch (item.kind) {
    case "metadata":
      return <MetadataItem {...item} delay={delay} />
    case "links":
      return <LinkItem {...item} delay={delay} />
    case "photo":
      return <PhotoItem {...item} delay={delay} />
    case "note":
      return <NoteItem {...item} delay={delay} />
  }
}
