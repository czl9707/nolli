import type { PlacedArchItem } from "@nolli/board"
import { PhotoItem, NoteItem, LinkItem } from "@nolli/board"
import { MetadataItem } from "./metadata-item"

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
