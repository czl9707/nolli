import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { SidebarCard } from "../arch-summary/sidebar-card"
import { FilterInput, type FilterItem } from "./filter-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { useFilterStore } from "@/stores/filter"
import { useSidebarStore } from "@/stores/sidebar"
import { useDbStore } from "@/stores/db"
import type { FilterOptions } from "@/lib/data/data-source.type"
import { ArchScrollList } from "../arch-summary/arch-scroll-list"
import { SearchInput } from "./search-input"
import { Body2 } from "@/components/ui/typography"
import styles from "./operation-panel.module.css"

function toArchitectItems(
  opts: FilterOptions,
  selectedIds: number[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items = opts.architects.map((a) => ({
    key: String(a.id),
    label: a.name,
    value: a.name,
  }))
  const selected = items.filter((i) =>
    selectedIds.includes(Number(i.key)),
  )
  return { items, selected }
}

function toLocationItems(
  opts: FilterOptions,
  selectedCityIds: number[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items: FilterItem[] = []
  const countryCities = new Map<
    string,
    { id: number; name: string }[]
  >()

  for (const ci of opts.cities) {
    const list = countryCities.get(ci.countryCode) ?? []
    list.push({ id: ci.id, name: ci.name })
    countryCities.set(ci.countryCode, list)
  }

  for (const c of opts.countries) {
    const cities = countryCities.get(c.code)
    if (!cities?.length) continue
    if (cities.length > 1) {
      items.push({
        key: `country:${c.code}`,
        label: "Select All",
        value: `select-all ${c.name} ${c.code}`,
        group: c.name,
      })
    }

    for (const ci of cities) {
      items.push({
        key: `city:${ci.id}`,
        label: ci.name,
        value: `${ci.name} ${c.name}`,
        group: c.name,
      })
    }
  }

  const selected = items.filter(
    (i) => {
      if (i.key.startsWith("country:")) {
        const code = i.key.replace("country:", "")
        const cityIds = countryCities.get(code)?.map((c) => c.id) ?? []
        return cityIds.every((id) => selectedCityIds.includes(id))
      }
      else {
        return selectedCityIds.includes(Number(i.key.replace("city:", "")))
      }
    }
  )

  return { items, selected }
}

function FilterSkeleton() {
  return (
    <div className={styles.skeletonGroup}>
      <Skeleton className={styles.skeletonLabel} height="0.75rem" width="6rem" />
      <Skeleton height="2.25rem" width="100%" />
      <Skeleton className={styles.skeletonLabel} height="0.75rem" width="5rem" />
      <Skeleton height="2.25rem" width="100%" />
    </div>
  )
}

export function OperationPanel() {
  const dataSource = useDbStore((s) => s.dataSource)
  const dataLoading = useDbStore((s) => s.loading)
  const dbError = useDbStore((s) => s.error)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const toggleArchitect = useFilterStore((s) => s.toggleArchitect)
  const clearArchitects = useFilterStore((s) => s.clearArchitect)
  const toggleCity = useFilterStore((s) => s.toggleCity)
  const clearCities = useFilterStore((s) => s.clearCity)
  const toggleCountry = useFilterStore((s) => s.toggleCountry)
  const [opts, setOpts] = useState<FilterOptions | null>(null)
  const filtersOpen = useSidebarStore((s) => s.filtersOpen)
  const setFiltersOpen = useSidebarStore((s) => s.setFiltersOpen)
  const activeFilterCount = architectIds.length + cityIds.length

  const cityIdsByCountry = useMemo(() => {
    if (!opts) return new Map<string, number[]>()
    const map = new Map<string, number[]>()
    for (const ci of opts.cities) {
      const list = map.get(ci.countryCode) ?? []
      list.push(ci.id)
      map.set(ci.countryCode, list)
    }
    return map
  }, [opts])

  useEffect(() => {
    if (dataLoading) return
    if (dbError != null || !dataSource) {
      setOpts({
        architects: [],
        cities: [],
        countries: [],
      })
      return
    }
    dataSource.getFilterOptions().then(setOpts)
  }, [dataSource, dataLoading, dbError])

  return (
    <>
      {/* <H5>Home</H5> */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} asChild>
        <SidebarCard className={styles.filterCard}>
          <SearchInput />
          <div className={styles.filtersToggleWrapper}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="xs" className={styles.filtersToggle}>
                {filtersOpen
                  ? "Hide filters"
                  : `Show filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
                {filtersOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className={styles.filtersCollapsableWrapper}>
            {opts ? (
              <>
                <FilterInput
                  label="Filter by Architect"
                  placeholder={dbError != null ? "Error" : "None"}
                  items={toArchitectItems(opts, architectIds).items}
                  selected={toArchitectItems(opts, architectIds).selected}
                  onToggle={(item) => toggleArchitect(Number(item.key))}
                  onClear={clearArchitects}
                />
                <FilterInput
                  label="Filter by Location"
                  placeholder={dbError != null ? "Error" : "None"}
                  items={toLocationItems(opts, cityIds).items}
                  selected={toLocationItems(opts, cityIds).selected}
                  onToggle={(item) => {
                    if (item.key.startsWith("country:")) {
                      const code = item.key.replace("country:", "")
                      const ids = cityIdsByCountry.get(code)
                      if (ids) toggleCountry(ids)
                    } else {
                      toggleCity(Number(item.key.replace("city:", "")))
                    }
                  }}
                  onClear={clearCities}
                />
              </>
            ) : (
              <FilterSkeleton />
            )}
          </CollapsibleContent>
        </SidebarCard>
      </Collapsible>
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
