import type { DataSource, ArchFilter, FilterOptions } from "./data-source.type"
import type { ArchSummary, Arch } from "./architectures.type"
import type { WorkerRequest, WorkerResponse } from "./worker-protocol.type"

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
  private initResolve!: (value: string | undefined) => void
  private initReject!: (err: Error) => void

  readonly ready: Promise<string | undefined>

  constructor() {
    this.ready = new Promise<string | undefined>((resolve, reject) => {
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
        pending.reject(new Error(msg.error))
      } else {
        pending.resolve(msg)
      }
    }

    this.worker.onerror = () => {
      localStorage.removeItem(MANIFEST_KEY)
      this.initReject(new Error("Worker failed to load"))
    }

    this.init().then(this.initResolve).catch(this.initReject)
  }

  private async init(): Promise<string | undefined> {
    let download = false
    let newHash: string | undefined
    const storedHash = localStorage.getItem(MANIFEST_KEY)

    let message = "";
    try {
      const res = await fetch(`${BASE_URL}/manifest.json`)
      if (res.ok) {
        const manifest = (await res.json()) as { version: string }
        download = manifest.version !== storedHash;
        newHash = manifest.version;
        message = download ? "" : "Map data is up to date. "
      }
    } catch {
      message = "Fail to fetch meta data. "
    }

    try {
      const response = await this.send({ type: "init", download })
      if (newHash) {
        localStorage.setItem(MANIFEST_KEY, newHash)
      }
      if (response.type === "ready") return message + (response.message ?? "")
      else throw new Error(`Unexpected response: ${response.type}`)
    } catch {
      localStorage.removeItem(MANIFEST_KEY)
      throw new Error("Failed to load map data")
    }
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
      .then((res) => {
        if (res.type === "getAllArchitectures") return res.data
        throw new Error(`Unexpected response: ${res.type}`)
      })
  }

  getArchBySlug(slug: string): Promise<Arch | null> {
    return this.send({ type: "getArchBySlug", slug })
      .then((res) => {
        if (res.type === "getArchBySlug") return res.data
        throw new Error(`Unexpected response: ${res.type}`)
      })
  }

  searchArchitectures(query: string): Promise<ArchSummary[]> {
    return this.send({ type: "searchArchitectures", query })
      .then((res) => {
        if (res.type === "searchArchitectures") return res.data
        throw new Error(`Unexpected response: ${res.type}`)
      })
  }

  getFilterOptions(): Promise<FilterOptions> {
    return this.send({ type: "getFilterOptions" })
      .then((res) => {
        if (res.type === "getFilterOptions") return res.data
        throw new Error(`Unexpected response: ${res.type}`)
      })
  }

  destroy() {
    this.worker.terminate()
  }
}
