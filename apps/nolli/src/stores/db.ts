import { create } from "zustand"
import type { DataSource } from "@/lib/data/data-source.type"
import { SqliteDataSource } from "@/lib/data/sqlite-source"
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

  const source = new SqliteDataSource()
  sourceRef = source

  source.ready
    .then((message) => {
      if (message) toast.info(message)
      useDbStore.setState({
        loading: false,
        dataSource: source,
        error: null,
      })
    })
    .catch((err: Error) => {
      setTimeout(() =>{
        toast.error(err.message || "Failed to load map data", { duration: 20000, position: "top-center" })
      }, 100)
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
  loading: true,
}))

initSource()
