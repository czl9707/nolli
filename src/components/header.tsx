import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="top-0 z-50 flex h-14 items-center gap-4 px-8 bg-background">
      <span className="text-lg font-extrabold tracking-tight pointer-events-none select-none">Arch Map</span>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
