import { useFilterOptions, useFilterStore } from "@nolli/data"
import { FilterPanel } from "@nolli/ui/composition"
import { Body2 } from "@nolli/ui"

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

  return (
    <>
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
      {filterError && (
        <Body2 style={{ opacity: 0.7 }}>
          Failed to get data. Try refreshing the page.
        </Body2>
      )}
    </>
  )
}
