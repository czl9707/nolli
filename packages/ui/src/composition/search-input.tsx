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
 * Uncontrolled, debounced text search. Owns its draft so typing stays
 * responsive across the consumer's round-trip; calls `onValueChange` on the
 * trailing edge of typing and immediately on clear (bypassing the debounce).
 * The first mount is skipped so the seeded value isn't echoed back. Seeds
 * from `defaultValue` once on mount, so the input survives unmount/remount
 * (e.g. navigating away and back) by re-reading the consumer's current value.
 */
export function SearchInput({
    defaultValue = "",
    onValueChange,
    placeholder = "Search",
}: {
    defaultValue?: string
    onValueChange: (v: string) => void
    placeholder?: string
}) {
    const [draft, setDraft] = useState(defaultValue)
    const timer = useRef<number | null>(null)
    const first = useRef(true)

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
        onValueChange("")
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
