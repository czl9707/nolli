import { useEffect, useState } from "react"
import { H5 } from "@/components/ui/typography"
import { SidebarCard } from "./sidebar-card"
import { FilterInput, type FilterItem } from "@/components/filter-input"
import {
  useFilterStore,
  type LocationFilter,
} from "@/stores/filter"
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
  selectedLocs: LocationFilter[],
): { items: FilterItem[]; selected: FilterItem[] } {
  const items: FilterItem[] = []

  for (const c of opts.countries) {
    const cities = opts.cities.filter(
      (ci) => ci.countryCode === c.code,
    )
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

  const selected = selectedLocs.map((l) => {
    if (l.type === "country") {
      return {
        key: `country:${l.code}`,
        label: l.name,
      }
    }
    return {
      key: `city:${l.id}`,
      label: `${l.name}`,
    }
  })

  return { items, selected }
}

export function OperationPanel() {
  const dataSource = useDbStore((s) => s.dataSource)
  const architectIds = useFilterStore((s) => s.architectIds)
  const locations = useFilterStore((s) => s.locations)
  const toggleArchitect = useFilterStore((s) => s.toggleArchitect)
  const toggleLocation = useFilterStore((s) => s.toggleLocation)
  const [opts, setOpts] = useState<FilterOptions | null>(null)

  useEffect(() => {
    dataSource?.getFilterOptions().then(setOpts)
  }, [dataSource])

  if (!opts) return null

  const { items: archItems, selected: archSelected } =
    toArchitectItems(opts, architectIds)
  const { items: locItems, selected: locSelected } = toLocationItems(
    opts,
    locations,
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
            onToggle={(item) =>
              toggleArchitect(Number(item.key))
            }
          />
          <FilterInput
            label="Location"
            placeholder="Filter by location..."
            items={locItems}
            selected={locSelected}
            onToggle={(item) => {
              if (item.key.startsWith("country:")) {
                const code = item.key.replace(
                  "country:",
                  "",
                )
                const country = opts.countries.find(
                  (c) => c.code === code,
                )
                if (country) {
                  toggleLocation({
                    type: "country",
                    code,
                    name: country.name,
                  })
                }
              } else {
                const id = Number(
                  item.key.replace("city:", ""),
                )
                const city = opts.cities.find(
                  (c) => c.id === id,
                )
                if (city) {
                  toggleLocation({
                    type: "city",
                    id,
                    name: city.name,
                    countryCode: city.countryCode,
                  })
                }
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
