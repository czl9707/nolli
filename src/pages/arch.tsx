import { PinBoard } from "@/components/pin-board"
import { useSelectedArch } from "@/contexts/selected-arch"

export function ArchContent() {
  const { lastSelectedArch } = useSelectedArch()

  if (!lastSelectedArch) return null

  return <PinBoard arch={lastSelectedArch} />
}
