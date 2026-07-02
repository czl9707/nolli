import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useFilterStore } from "@/stores/filter"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@nolli/ui"
import styles from "./search-input.module.css"

const DEBOUNCE_MS = 250

/**
 * Debounced text search. Owns local input state so typing stays responsive and
 * is never blocked by the worker round-trip; the store's `searchQuery` is only
 * updated 250ms after typing stops (trailing edge). The first mount is skipped
 * so we don't fire a redundant refetch on load.
 */
export function SearchInput() {
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  // Seed from the store so the input survives unmount/remount (e.g. navigating
  // into an arch and back). The store is the source of truth; local state only
  // exists to keep typing responsive across the debounce round-trip.
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const [value, setValue] = useState(searchQuery)
  const timer = useRef<number | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    timer.current = window.setTimeout(() => {
      setSearchQuery(value)
    }, DEBOUNCE_MS)
    return () => {
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [value, setSearchQuery])

  function handleClear() {
    if (timer.current !== null) clearTimeout(timer.current)
    setValue("")
    setSearchQuery("") // immediate — no need to wait out the debounce
  }

  return (
    <InputGroup className={styles.root}>
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name or architect"
        aria-label="Search architectures"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
