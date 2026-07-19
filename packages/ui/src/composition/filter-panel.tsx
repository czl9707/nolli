import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { FilterOptions } from "@nolli/data"
import { Button, Skeleton } from "@nolli/ui"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@nolli/ui"
import { FilterInput, type FilterItem } from "./filter-input"
import { SearchInput } from "./search-input"
import styles from "./operation-panel.module.css"

/**
 * Pure view-model mappers: turn the flat `FilterOptions` (data shape) into the
 * `FilterItem[]` shape `<FilterInput>` consumes, splitting the selected items
 * out so they render as removable badges.
 *
 * `toLocationItems` also synthesizes a per-country "Select All" entry when a
 * country has more than one city; its `key` is `country:<code>`.
 */
function toArchitectItems(
  opts: FilterOptions,
  selectedIds: number[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items = opts.architects.map((a) => ({
    key: String(a.id),
    label: a.name,
    value: a.name,
  }))
  const selected = items.filter((i) => selectedIds.includes(Number(i.key)))
  return { items, selected }
}

function toLocationItems(
  opts: FilterOptions,
  selectedCityIds: number[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items: FilterItem[] = []
  const countryCities = new Map<string, { id: number; name: string }[]>()

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

  const selected = items.filter((i) => {
    if (i.key.startsWith("country:")) {
      const code = i.key.replace("country:", "")
      const cityIds = countryCities.get(code)?.map((c) => c.id) ?? []
      return cityIds.every((id) => selectedCityIds.includes(id))
    }
    return selectedCityIds.includes(Number(i.key.replace("city:", "")))
  })

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

export type FilterPanelProps = {
  /** Filter options from `dataSource.getFilterOptions()`. `null` while loading. */
  options: FilterOptions | null
  searchQuery: string
  architectIds: number[]
  cityIds: number[]
  onSearchChange: (value: string) => void
  onToggleArchitect: (id: number) => void
  onClearArchitects: () => void
  onToggleCity: (id: number) => void
  onToggleCountry: (cityIdsInCountry: number[]) => void
  onClearCities: () => void
  /** When true, inputs show an "Error" placeholder (e.g. db failed to load). */
  error?: boolean
}

/**
 * Presentational filter panel: a search input plus an architect and a location
 * multi-select behind a "Show filters (N)" collapsible. Owns the
 * `FilterOptions → FilterItem` mapping, the loading skeleton, and the
 * collapsible open-state — but reads **no store** and fetches **no data**. The
 * app supplies the option lists, the current selection, and the toggle
 * callbacks (typically wired from `useFilterStore` + `useFilterOptions()`), so
 * `@nolli/ui` stays free of data-store coupling. Both apps render this exact
 * component; only their outer framing differs.
 *
 * The location "Select All" entry's `key` is `country:<code>`; the country's
 * city ids are resolved here from `options` and forwarded to `onToggleCountry`.
 */
export function FilterPanel({
  options,
  searchQuery,
  architectIds,
  cityIds,
  onSearchChange,
  onToggleArchitect,
  onClearArchitects,
  onToggleCity,
  onToggleCountry,
  onClearCities,
  error = false,
}: FilterPanelProps) {
  const activeFilterCount = architectIds.length + cityIds.length
  const [open, setOpen] = useState(activeFilterCount > 0)

  const cityIdsByCountry = useMemo(() => {
    if (!options) return new Map<string, number[]>()
    const map = new Map<string, number[]>()
    for (const ci of options.cities) {
      const list = map.get(ci.countryCode) ?? []
      list.push(ci.id)
      map.set(ci.countryCode, list)
    }
    return map
  }, [options])

  const architect = options
    ? toArchitectItems(options, architectIds)
    : { items: [], selected: [] }
  const location = options
    ? toLocationItems(options, cityIds)
    : { items: [], selected: [] }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SearchInput
        defaultValue={searchQuery}
        onValueChange={onSearchChange}
        placeholder="Search by name or architect"
      />
      <div className={styles.toggleWrapper}>
        <CollapsibleTrigger asChild>
          <Button variant="link" size="xs" className={styles.toggle}>
            {open
              ? "Hide filters"
              : `Show filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={styles.collapsibleWrapper}>
        {options ? (
          <>
            <FilterInput
              label="Filter by Architect"
              placeholder={error ? "Error" : "None"}
              items={architect.items}
              selected={architect.selected}
              onToggle={(item) => onToggleArchitect(Number(item.key))}
              onClear={onClearArchitects}
            />
            <FilterInput
              label="Filter by Location"
              placeholder={error ? "Error" : "None"}
              items={location.items}
              selected={location.selected}
              onToggle={(item) => {
                if (item.key.startsWith("country:")) {
                  const code = item.key.replace("country:", "")
                  const ids = cityIdsByCountry.get(code)
                  if (ids) onToggleCountry(ids)
                } else {
                  onToggleCity(Number(item.key.replace("city:", "")))
                }
              }}
              onClear={onClearCities}
            />
          </>
        ) : (
          <FilterSkeleton />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
