import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupButton,
} from "@nolli/ui"
import styles from "./search-input.module.css"

const DEBOUNCE_MS = 250

/**
 * Controlled, debounced text search. Owns a local draft so typing stays
 * responsive across the consumer's round-trip; calls `onValueChange` on the
 * trailing edge of typing and `onClear` immediately. The first mount is
 * skipped so we don't echo the seeded value back. The draft syncs to `value`
 * when the prop changes externally (e.g. the parent clears).
 */
export function SearchInput({
    value,
    onValueChange,
    onClear,
    placeholder = "Search",
}: {
    value: string
    onValueChange: (v: string) => void
    onClear: () => void
    placeholder?: string
}) {
    const [draft, setDraft] = useState(value)
    const timer = useRef<number | null>(null)
    const first = useRef(true)

    // Sync draft when the parent's value changes from elsewhere.
    useEffect(() => {
        setDraft((d) => (d === value ? d : value))
    }, [value])

    useEffect(() => {
        if (first.current) {
            first.current = false
            return
        }
        timer.current = window.setTimeout(() => {
            onValueChange(draft)
        }, DEBOUNCE_MS)
        return () => {
            if (timer.current !== null) clearTimeout(timer.current)
        }
    }, [draft, onValueChange])

    function handleClear() {
        if (timer.current !== null) clearTimeout(timer.current)
        setDraft("")
        onClear()
    }

    return (
        <InputGroup className={styles.root}>
            <InputGroupAddon align="inline-start">
                <Search />
            </InputGroupAddon>
            <InputGroupInput
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                aria-label="Search architectures"
            />
            {draft && (
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
