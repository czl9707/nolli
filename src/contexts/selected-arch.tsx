import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"
import { getArchBySlug, type Arch } from "@/lib/data/architectures"

type SelectedArchContextValue = {
  lastSelectedArch: Arch | null
  setLastSelectedArch: (arch: Arch | null) => void
  flyToTrigger: number
}

const SelectedArchContext = createContext<SelectedArchContextValue>({
  lastSelectedArch: null,
  setLastSelectedArch: () => {},
  flyToTrigger: 0,
})

export function SelectedArchProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [lastSelectedArch, setLastSelectedArchState] = useState<Arch | null>(null)
  const [flyToTrigger, setFlyToTrigger] = useState(0)

  const currentArch = useMemo(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match) return null
    return getArchBySlug(match[1])
  }, [location.pathname])

  const setLastSelectedArch = (arch: Arch | null) => {
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
    <SelectedArchContext.Provider value={{ lastSelectedArch, setLastSelectedArch, flyToTrigger }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
