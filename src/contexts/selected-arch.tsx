import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"
import { getArchBySlug, type Arch, type ArchSummary } from "@/lib/data/architectures"

type SelectedArchContextValue = {
  lastSelectedArch: ArchSummary | null
  currentArch: Arch | null
  setLastSelectedArch: (arch: ArchSummary | null) => void
  flyToTrigger: number
}

const SelectedArchContext = createContext<SelectedArchContextValue>({
  lastSelectedArch: null,
  currentArch: null,
  setLastSelectedArch: () => {},
  flyToTrigger: 0,
})

export function SelectedArchProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [lastSelectedArch, setLastSelectedArchState] = useState<ArchSummary | null>(null)
  const [flyToTrigger, setFlyToTrigger] = useState(0)

  const [currentArch, setCurrentArch] = useState<Arch | null>(null)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    getArchBySlug(match[1]).then(setCurrentArch)
  }, [location.pathname])

  const setLastSelectedArch = (arch: ArchSummary | null) => {
    setLastSelectedArchState(arch)
    if (arch) setFlyToTrigger((n) => n + 1)
  }

  useEffect(() => {
    if (currentArch) {
      setLastSelectedArchState(currentArch)
      setFlyToTrigger((n) => n + 1)
    }
  }, [currentArch])

  return (
    <SelectedArchContext.Provider value={{ lastSelectedArch, currentArch, setLastSelectedArch, flyToTrigger }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
