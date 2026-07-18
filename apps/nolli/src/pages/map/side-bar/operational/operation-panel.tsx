import { useEffect } from "react"
import { SidebarCard } from "@/components/card/sidebar-card"
import { FilterPanel } from "@nolli/ui/composition"
import { Body2 } from "@nolli/ui"
import { useFilterOptions, useFilterStore } from "@nolli/data"
import { ArchScrollList } from "../arch-summary/arch-card-list"
import { toast } from "sonner"
import styles from "./operation-panel.module.css"

export function OperationPanel() {
  const { options, dbError } = useFilterOptions()
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  const toggleArchitect = useFilterStore((s) => s.toggleArchitect)
  const clearArchitects = useFilterStore((s) => s.clearArchitect)
  const toggleCity = useFilterStore((s) => s.toggleCity)
  const clearCities = useFilterStore((s) => s.clearCity)
  const toggleCountry = useFilterStore((s) => s.toggleCountry)
  const filterError = useFilterStore((s) => s.error)

  useEffect(() => {
    if (filterError) {
      toast.error("Failed to get data. Try refreshing the page.")
    }
  }, [filterError])

  return (
    <>
      <SidebarCard className={styles.filterCard}>
        <FilterPanel
          options={options}
          error={dbError != null}
          searchQuery={searchQuery}
          architectIds={architectIds}
          cityIds={cityIds}
          onSearchChange={setSearchQuery}
          onToggleArchitect={toggleArchitect}
          onClearArchitects={clearArchitects}
          onToggleCity={toggleCity}
          onToggleCountry={toggleCountry}
          onClearCities={clearCities}
        />
      </SidebarCard>
      <FilterResults />
    </>
  )
}

/** Filter-driven list: loading / no-filter / empty-match states, then results. */
function FilterResults() {
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const hasFilters =
    architectIds.length > 0 || cityIds.length > 0 || searchQuery.trim() !== ""
  const filterLoading = useFilterStore((s) => s.loading)

  if (!hasFilters || filterLoading) {
    return (
      <Body2 className={styles.emptyState}>
        {filterLoading ? "Loading..." : "No filters applied."}
      </Body2>
    )
  }

  if (filteredArchs.length === 0) {
    return (
      <Body2 className={styles.emptyState}>
        No architectures match your filters
      </Body2>
    )
  }

  return <ArchScrollList archs={filteredArchs} />
}
