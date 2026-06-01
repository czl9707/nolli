import { create } from "zustand"
import type { DataSource } from "@/lib/data/data-source.type"
import { SqliteDataSource } from "@/lib/data/sqlite-source"

type DbState = {
  status: "loading" | "ready" | "error"
  dataSource: DataSource | null
  error: Error | null
  retry: () => void
}

let sourceRef: SqliteDataSource | null = null

function initSource() {
  if (sourceRef) {
    sourceRef.destroy()
    sourceRef = null
  }

  useDbStore.setState({
    status: "loading",
    dataSource: null,
    error: null,
  })

  const source = new SqliteDataSource()
  sourceRef = source

  source.ready
    .then(() => {
      useDbStore.setState({
        status: "ready",
        dataSource: source,
        error: null,
      })
    })
    .catch((err: Error) => {
      useDbStore.setState({
        status: "error",
        dataSource: null,
        error: err,
      })
    })
}

export const useDbStore = create<DbState>(() => ({
  status: "loading",
  dataSource: null,
  error: null,
  retry: initSource,
}))

initSource()
