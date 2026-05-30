import { createContext, useContext, useEffect, useRef, useState } from "react"
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
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    getArchBySlug(match[1]).then((arch) => {
      if (arch) {
        setLastSelectedArchState(arch)
        setFlyToTrigger((n) => n + 1)
      }
    })
  }, [location.pathname])

  const setLastSelectedArch = (arch: Arch | null) => {
    setLastSelectedArchState(arch)
    if (arch) setFlyToTrigger((n) => n + 1)
  }

  return (
    <SelectedArchContext.Provider value={{ lastSelectedArch, setLastSelectedArch, flyToTrigger }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
