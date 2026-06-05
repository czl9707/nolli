import { useEffect, useMemo, useState } from "react"
import { H5 } from "@/components/ui/typography"
import { SidebarCard } from "./sidebar-card"
import { FilterInput, type FilterItem } from "@/components/filter-input"
import { useFilterStore } from "@/stores/filter"
import { useDbStore } from "@/stores/db"
import type { FilterOptions } from "@/lib/data/data-source.type"
import styles from "./operation-panel.module.css"

function toArchitectItems(
  opts: FilterOptions,
  selectedIds: number[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items = opts.architects.map((a) => ({
    key: String(a.id),
    label: a.name,
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

    items.push({
      key: `country:${c.code}`,
      label: c.name,
      group: c.name,
    })
    for (const ci of cities) {
      items.push({
        key: `city:${ci.id}`,
        label: `${c.name} — ${ci.name}`,
        group: c.name,
      })
    }
  }

  const selected = items.filter(
    (i) =>
      i.key.startsWith("city:") &&
      selectedCityIds.includes(Number(i.key.replace("city:", ""))),
  )

  return { items, selected }
}

export function OperationPanel() {
  const dataSource = useDbStore((s) => s.dataSource)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const toggleArchitect = useFilterStore((s) => s.toggleArchitect)
  const toggleCity = useFilterStore((s) => s.toggleCity)
  const toggleCountry = useFilterStore((s) => s.toggleCountry)
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
    dataSource?.getFilterOptions().then(setOpts)
  }, [dataSource])

  if (!opts) return null

  const { items: archItems, selected: archSelected } =
    toArchitectItems(opts, architectIds)
  const { items: locItems, selected: locSelected } = toLocationItems(
    opts,
    cityIds,
  )

  return (
    <>
      <SidebarCard>
        <H5 className={styles.heading}>Filters</H5>
        <div className={styles.filterGroup}>
          <FilterInput
            label="Architect"
            placeholder="Filter by architect..."
            items={archItems}
            selected={archSelected}
            onToggle={(item) => toggleArchitect(Number(item.key))}
          />
          <FilterInput
            label="Location"
            placeholder="Filter by location..."
            items={locItems}
            selected={locSelected}
            onToggle={(item) => {
              if (item.key.startsWith("country:")) {
                const code = item.key.replace("country:", "")
                const ids = cityIdsByCountry.get(code)
                if (ids) toggleCountry(ids)
              } else {
                toggleCity(Number(item.key.replace("city:", "")))
              }
            }}
          />
        </div>
      </SidebarCard>
      <SidebarCard>
        <H5 className={styles.heading}>Collections</H5>
      </SidebarCard>
    </>
  )
}
