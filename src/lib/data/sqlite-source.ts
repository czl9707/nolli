import type { DataSource, ArchFilter, FilterOptions } from "./data-source"
import type { ArchSummary, Arch } from "./types"

type WorkerRequest =
  | { type: "init" }
  | { type: "getAllArchitectures"; msgId: number; filter?: ArchFilter }
  | { type: "getArchBySlug"; msgId: number; slug: string }
  | { type: "searchArchitectures"; msgId: number; query: string }
  | { type: "getFilterOptions"; msgId: number }

type WorkerResponse =
  | { type: "ready" }
  | { type: "error"; msgId?: number; error: string }
  | { type: "result"; msgId: number; data: unknown }

export type DbStatus = "loading" | "ready" | "error"

type PendingMessage = {
  resolve: (data: unknown) => void
  reject: (error: Error) => void
}

export class SqliteDataSource implements DataSource {
  private worker: Worker
  private msgId = 0
  private pending = new Map<number, PendingMessage>()
  private initResolve!: () => void
  private initReject!: (err: Error) => void
  private _status: DbStatus = "loading"
  private _error: Error | null = null

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
      const err = new Error(e.message || "Worker error")
      this._status = "error"
      this._error = err
      this.initReject(err)
      this.rejectAll(err)
    }

    this.worker.postMessage({ type: "init" } as WorkerRequest)
  }

  private handleMessage(msg: WorkerResponse) {
    if (msg.type === "ready") {
      this._status = "ready"
      this._error = null
      this.initResolve()
      return
    }

    if (msg.type === "error") {
      const err = new Error(msg.error)
      if (msg.msgId != null) {
        const pending = this.pending.get(msg.msgId)
        if (pending) {
          this.pending.delete(msg.msgId)
          pending.reject(err)
        }
      } else {
        this._status = "error"
        this._error = err
        this.rejectAll(err)
      }
      return
    }

    if (msg.type === "result") {
      const pending = this.pending.get(msg.msgId)
      if (pending) {
        this.pending.delete(msg.msgId)
        pending.resolve(msg.data)
      }
    }
  }

  private rejectAll(err: Error) {
    for (const [id, pending] of this.pending) {
      this.pending.delete(id)
      pending.reject(err)
    }
  }

  private send<T>(msg: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.msgId++
      this.pending.set(id, {
        resolve: (data) => resolve(data as T),
        reject,
      })
      this.worker.postMessage({ ...msg, msgId: id } as WorkerRequest)
    })
  }

  getStatus(): DbStatus {
    return this._status
  }

  getError(): Error | null {
    return this._error
  }

  getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]> {
    return this.send<ArchSummary[]>({ type: "getAllArchitectures", filter })
  }

  getArchBySlug(slug: string): Promise<Arch | null> {
    return this.send<Arch | null>({ type: "getArchBySlug", slug })
  }

  searchArchitectures(query: string): Promise<ArchSummary[]> {
    return this.send<ArchSummary[]>({ type: "searchArchitectures", query })
  }

  getFilterOptions(): Promise<FilterOptions> {
    return this.send<FilterOptions>({ type: "getFilterOptions" })
  }

  destroy() {
    this.rejectAll(new Error("DataSource destroyed"))
    this.worker.terminate()
    this._status = "error"
    this._error = new Error("Destroyed")
  }
}
