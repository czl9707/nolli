import { createContext, useContext, useMemo, useRef } from "react"
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
  const lastRef = useRef<Arch | null>(null)

  const currentArch = useMemo(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match) return null
    return getArchBySlug(match[1])
  }, [location.pathname])

  if (currentArch) lastRef.current = currentArch

  return (
    <SelectedArchContext.Provider value={{ lastSelectedArch: lastRef.current }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
