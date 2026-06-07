import { create } from "zustand"
import type { DataSource } from "@/lib/data/data-source.type"
import { SqliteDataSource } from "@/lib/data/sqlite-source"
import { initFilterSync } from "./filter"
import { toast } from "sonner"

type DbState = {
  loading: boolean
  dataSource: DataSource | null
  error: Error | null
}

let sourceRef: SqliteDataSource | null = null

function initSource() {
  if (sourceRef) {
    sourceRef.destroy()
    sourceRef = null
  }

  useDbStore.setState({
    loading: true,
    dataSource: null,
    error: null,
  })

  const source = new SqliteDataSource({
    onWarning: (message) => toast.info(message),
  })
  sourceRef = source

  source.ready
    .then(() => {
      useDbStore.setState({
        loading: false,
        dataSource: source,
        error: null,
      })
      initFilterSync(source)
    })
    .catch((err: Error) => {
      toast.error("Failed to load map data", {
        description: err.message,
      })
      useDbStore.setState({
        loading: false,
        dataSource: null,
        error: err,
      })
    })
}

export const useDbStore = create<DbState>(() => ({
  dataSource: null,
  error: null,
  loading: true
}))

initSource()
