import type { Arch } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { MetadataItem } from "./metadata-item"
import { PhotoItem } from "./photo-item"
import { NoteItem } from "./note-item"
import { LinkItem } from "./link-item"

export function parseItemIndex(id: string, prefix: string): number {
  return parseInt(id.slice(prefix.length), 10)
}

export function PinBoardItem({
  item,
  arch,
  delay,
}: {
  item: PlacedItem
  arch: Arch
  delay: number
}) {
  if (item.id === "metadata") {
    return <MetadataItem arch={arch} item={item} delay={delay} />
  }
  if (item.id === "links") {
    return <LinkItem links={arch.links} item={item} delay={delay} />
  }
  if (item.id.startsWith("photo-")) {
    return (
      <PhotoItem
        photo={arch.photos[parseItemIndex(item.id, "photo-")]}
        item={item}
        delay={delay}
      />
    )
  }
  if (item.id.startsWith("note-")) {
    return (
      <NoteItem
        note={arch.notes[parseItemIndex(item.id, "note-")]}
        item={item}
        delay={delay}
      />
    )
  }
  return null
}
