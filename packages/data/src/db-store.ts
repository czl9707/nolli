import { create } from "zustand"
import type { DataSource } from "./data-source.type"
import { SqliteDataSource } from "./sqlite-source"

/**
 * Shared db bootstrap store. Spawns the sqlite-wasm/OPFS worker (via
 * SqliteDataSource), downloads/caches the live DB, and publishes the ready
 * DataSource to consumers. Both nolli and poster use this — neither app owns
 * bootstrap logic.
 *
 * UI side-effects (toasts, error copy) are intentionally NOT handled here: the
 * ready `message` and `error` are exposed in state so each app can present them
 * in its own UI.
 */
type DbState = {
  loading: boolean
  dataSource: DataSource | null
  error: Error | null
  message: string | null
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
    message: null,
  })

  const source = new SqliteDataSource()
  sourceRef = source

  source.ready
    .then((message) => {
      useDbStore.setState({
        loading: false,
        dataSource: source,
        error: null,
        message: message ?? null,
      })
    })
    .catch((err: Error) => {
      useDbStore.setState({
        loading: false,
        dataSource: null,
        error: err,
      })
    })
}

export const useDbStore = create<DbState>(() => ({
  loading: true,
  dataSource: null,
  error: null,
  message: null,
}))

initSource()
