import type { DataSource, ArchFilter, FilterOptions } from "./data-source.type"
import type { ArchSummary, Arch } from "./architectures.type"
import type { WorkerRequest, WorkerResponse } from "./worker-protocol.type"

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
      this.handleMessage(e.data)
    }

    this.worker.onerror = (e: ErrorEvent) => {
      this.initReject(new Error(e.message || "Worker error"))
    }

    this.worker.postMessage({ type: "init" })
  }

  private handleMessage(msg: WorkerResponse) {
    switch (msg.type) {
      case "ready":
        this.initResolve()
        break
      case "error":
        this.pending.get(msg.msgId)?.reject(new Error(msg.error))
        this.pending.delete(msg.msgId)
        break
      default:
        this.pending.get(msg.msgId)?.resolve(msg)
        this.pending.delete(msg.msgId)
    }
  }

  private send<T extends WorkerRequest>(msg: T): Promise<WorkerResponse> {
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
