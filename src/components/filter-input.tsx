import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Caption } from "@/components/ui/typography"
import styles from "./filter-input.module.css"

type FilterItem = {
    key: string
    label: string
    group?: string
}

type FilterInputProps = {
    label: string
    placeholder: string
    items: FilterItem[]
    selected: FilterItem[]
    onToggle: (item: FilterItem) => void
}

function FilterInput({
    label,
    placeholder,
    items,
    selected,
    onToggle,
}: FilterInputProps) {
    const [open, setOpen] = React.useState(false)

    const grouped = React.useMemo(() => {
        const groups = new Map<string, FilterItem[]>()
        for (const item of items) {
            const g = item.group ?? ""
            if (!groups.has(g)) groups.set(g, [])
            groups.get(g)!.push(item)
        }
        return groups
    }, [items])

    const hasGroups = items.some((i) => i.group !== undefined)

    return (
        <div>
            <Caption asChild>
                <label className={styles.label}>{label}</label>
            </Caption>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div
                        role="combobox"
                        aria-expanded={open}
                        aria-label={label}
                        tabIndex={0}
                        data-state={open ? "open" : "closed"}
                        className={styles.trigger}
                    >
                        {selected.length === 0 && (
                            <span className={styles.placeholder}>{placeholder}</span>
                        )}
                        {selected.map((s) => (
                            <Badge
                                key={s.key}
                                variant="secondary"
                                className={styles.badge}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggle(s)
                                }}
                            >
                                {s.label}
                                <X />
                            </Badge>
                        ))}
                        <ChevronDown className={styles.chevron} />
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className={styles.popover}
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command>
                        <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            {hasGroups
                                ? Array.from(grouped.entries()).map(
                                    ([group, groupItems]) => (
                                        <CommandGroup
                                            key={group}
                                            heading={group}
                                        >
                                            {groupItems.map((item) => (
                                                <CommandItem
                                                    key={item.key}
                                                    value={item.label}
                                                    data-checked={selected.some(
                                                        (s) =>
                                                            s.key === item.key,
                                                    )}
                                                    onSelect={() => {
                                                        onToggle(item)
                                                    }}
                                                >
                                                    {item.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ),
                                )
                                : items.map((item) => (
                                    <CommandItem
                                        key={item.key}
                                        value={item.label}
                                        data-checked={selected.some(
                                            (s) => s.key === item.key,
                                        )}
                                        onSelect={() => {
                                            onToggle(item)
                                        }}
                                    >
                                        {item.label}
                                    </CommandItem>
                                ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export { FilterInput }
export type { FilterItem, FilterInputProps }
