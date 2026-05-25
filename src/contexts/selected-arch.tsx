import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"
import { getArchBySlug, type Arch } from "@/lib/data/architectures"

type SelectedArchContextValue = {
  lastSelectedArch: Arch | null
}

const SelectedArchContext = createContext<SelectedArchContextValue>({
  lastSelectedArch: null,
})

export function SelectedArchProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [lastSelectedArch, setLastSelectedArch] = useState<Arch | null>(null)

  const currentArch = useMemo(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match) return null
    return getArchBySlug(match[1])
  }, [location.pathname])

  useEffect(() => {
    if (currentArch) setLastSelectedArch(currentArch)
  }, [currentArch])

  return (
    <SelectedArchContext.Provider value={{ lastSelectedArch }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
