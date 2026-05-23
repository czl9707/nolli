import { createContext, useContext, useMemo } from "react"
import { useLocation } from "react-router"
import { getArchBySlug, type Arch } from "@/data/architectures"

type SelectedArchContextValue = {
  arch: Arch | null
}

const SelectedArchContext = createContext<SelectedArchContextValue>({
  arch: null,
})

export function SelectedArchProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const arch = useMemo(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match) return null
    return getArchBySlug(match[1])
  }, [location.pathname])

  return (
    <SelectedArchContext.Provider value={{ arch }}>
      {children}
    </SelectedArchContext.Provider>
  )
}

export function useSelectedArch() {
  return useContext(SelectedArchContext)
}
