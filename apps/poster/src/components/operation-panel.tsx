import { useEffect, useMemo, useState } from "react"
import { useDbStore, useFilterStore } from "@nolli/data"
import type { FilterOptions } from "@nolli/data"
import {
  FilterInput,
  SearchInput,
  type FilterItem,
} from "@nolli/ui/composition"
import { Body2 } from "@nolli/ui"

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

export function OperationPanel() {
  const dataSource = useDbStore((s) => s.dataSource)
  const dataLoading = useDbStore((s) => s.loading)
  const dbError = useDbStore((s) => s.error)

  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const toggleArchitect = useFilterStore((s) => s.toggleArchitect)
  const clearArchitects = useFilterStore((s) => s.clearArchitect)
  const toggleCity = useFilterStore((s) => s.toggleCity)
  const clearCities = useFilterStore((s) => s.clearCity)
  const toggleCountry = useFilterStore((s) => s.toggleCountry)
  const filterError = useFilterStore((s) => s.error)

  const [opts, setOpts] = useState<FilterOptions | null>(null)

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
      setOpts({ architects: [], cities: [], countries: [] })
      return
    }
    dataSource.getFilterOptions().then(setOpts)
  }, [dataSource, dataLoading, dbError])

  return (
    <>
      <SearchInput
        defaultValue={searchQuery}
        onValueChange={setSearchQuery}
        placeholder="Search by name or architect"
      />
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
      ) : null}
      {filterError && (
        <Body2 style={{ opacity: 0.7 }}>
          Failed to get data. Try refreshing the page.
        </Body2>
      )}
    </>
  )
}
