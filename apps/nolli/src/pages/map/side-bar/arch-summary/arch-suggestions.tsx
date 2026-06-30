import { Shuffle } from "lucide-react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useRelatedBuildings, SUGGESTION_CAP } from "./use-related-buildings"
import { ArchCardList } from "./arch-card-list"
import { H5 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import type { ArchSummary } from "@/lib/data/architectures.type"
import styles from "./arch-suggestions.module.css"

export function ArchSuggestions() {
  const arch = useArchDetailStore((s) => s.selected)
  const { architect, city, loading } = useRelatedBuildings(arch)

  // Spec: render nothing while loading or when there is nothing to suggest.
  if (!arch || loading) return null
  if (architect.items.length === 0 && city.items.length === 0) return null

  return (
    <>
      {architect.items.length > 0 && (
        <Section
          title={`Also by ${arch.architect}`}
          items={architect.items}
          total={architect.total}
          onShuffle={architect.shuffle}
        />
      )}
      {city.items.length > 0 && (
        <Section
          title={`Also in ${arch.city}, ${arch.country}`}
          items={city.items}
          total={city.total}
          onShuffle={city.shuffle}
        />
      )}
    </>
  )
}

function Section({
  title,
  items,
  total,
  onShuffle,
}: {
  title: string
  items: ArchSummary[]
  total: number
  onShuffle: () => void
}) {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <H5 className={styles.title}>{title}</H5>
        {total > SUGGESTION_CAP && (
          <Button
            className={styles.shuffleButton}
            variant="ghost"
            size="icon-xs"
            onClick={onShuffle}
            aria-label="Shuffle suggestions"
          >
            <Shuffle size={14} />
          </Button>
        )}
      </div>
      {/* mode="push" → Back retraces suggestion hops. */}
      <ArchCardList archs={items} mode="push" />
    </div>
  )
}
