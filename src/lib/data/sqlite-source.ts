import type { DataSource, ArchFilter, FilterOptions } from "./data-source.type"
import type { ArchSummary, Arch } from "./architectures.type"
import type { WorkerRequest, WorkerResponse } from "./worker-protocol.type"
import { toast } from "sonner"

const MANIFEST_KEY = "nolli-db-sha256"
const BASE_URL = import.meta.env.VITE_R2_PUBLIC_DB_URL as string

type PendingMessage = {
  resolve: (response: WorkerResponse) => void
  reject: (error: Error) => void
}

export class SqliteDataSource implements DataSource {
  private worker: Worker
  private msgId = 0
  private pending = new Map<number, PendingMessage>()
  private initResolve!: () => void
  private initReject!: (err: Error) => void

  readonly ready: Promise<void>

  constructor() {
    this.ready = new Promise<void>((resolve, reject) => {
      this.initResolve = resolve
      this.initReject = reject
    })

    this.worker = new Worker(
      new URL("./sqlite-worker.ts", import.meta.url),
      { type: "module" },
    )

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data
      const pending = this.pending.get(msg.msgId)
      if (!pending) return
      this.pending.delete(msg.msgId)

      if (msg.type === "error") {
        toast.error("Failed to load map data")
        pending.reject(new Error(msg.error))
      } else {
        if (msg.type === "ready" && msg.message) {
          toast.info(msg.message)
        }
        pending.resolve(msg)
      }
    }

    this.worker.onerror = (e: ErrorEvent) => {
      this.initReject(new Error(e.message || "Worker error"))
    }

    this.init().then(this.initResolve).catch(this.initReject)
  }

  private async init(): Promise<void> {
    let download = false
    const storedHash = localStorage.getItem(MANIFEST_KEY)

    try {
      const res = await fetch(`${BASE_URL}/manifest.json`)
      if (res.ok) {
        const manifest = (await res.json()) as { version: string }
        if (manifest.version !== storedHash) {
          download = true
          localStorage.setItem(MANIFEST_KEY, manifest.version)
        }
        else {
          toast.info("Map data is up to date.")
        }
      }
    } catch {
      toast.info("Failed to fetch manifest.")
    }

    await this.send({ type: "init", download })
  }

  private send(msg: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const id = this.msgId++
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ ...msg, msgId: id })
    })
  }

  getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]> {
    return this.send({ type: "getAllArchitectures", filter })
      .then((res) => (res as { data: ArchSummary[] }).data)
  }

  getArchBySlug(slug: string): Promise<Arch | null> {
    return this.send({ type: "getArchBySlug", slug })
      .then((res) => (res as { data: Arch | null }).data)
  }

  searchArchitectures(query: string): Promise<ArchSummary[]> {
    return this.send({ type: "searchArchitectures", query })
      .then((res) => (res as { data: ArchSummary[] }).data)
  }

  getFilterOptions(): Promise<FilterOptions> {
    return this.send({ type: "getFilterOptions" })
      .then((res) => (res as { data: FilterOptions }).data)
  }

  destroy() {
    this.worker.terminate()
  }
}
