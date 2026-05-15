import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-4 px-8 bg-[linear-gradient(to_bottom,var(--color-background)_25%,transparent)]">
      <span className="text-lg font-extrabold tracking-tight pointer-events-none select-none">Arch Map</span>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
