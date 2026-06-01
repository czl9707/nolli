import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import type { DataSource } from "./data-source"
import { SqliteDataSource } from "./sqlite-source"

export type DbState = {
  status: "loading" | "ready" | "error"
  dataSource: DataSource | null
  error: Error | null
  retry: () => void
}

const DbContext = createContext<DbState | null>(null)

export function useDbContext(): DbState {
  const ctx = useContext(DbContext)
  if (!ctx) {
    throw new Error("useDbContext must be used within a DbProvider")
  }
  return ctx
}

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DbState>({
    status: "loading",
    dataSource: null,
    error: null,
    retry: () => {},
  })

  const sourceRef = useRef<SqliteDataSource | null>(null)
  const mountedRef = useRef(true)

  const initSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.destroy()
      sourceRef.current = null
    }

    const source = new SqliteDataSource()
    sourceRef.current = source

    setState({
      status: "loading",
      dataSource: null,
      error: null,
      retry: () => {},
    })

    source.ready
      .then(() => {
        if (mountedRef.current) {
          setState({
            status: "ready",
            dataSource: source,
            error: null,
            retry: () => {},
          })
        }
      })
      .catch((err: Error) => {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err,
          }))
        }
      })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    initSource()

    return () => {
      mountedRef.current = false
      if (sourceRef.current) {
        sourceRef.current.destroy()
        sourceRef.current = null
      }
    }
  }, [initSource])

  useEffect(() => {
    if (state.status !== "error") return
    setState((prev) => ({ ...prev, retry: initSource }))
  }, [state.status, initSource])

  return <DbContext.Provider value={state}>{children}</DbContext.Provider>
}
