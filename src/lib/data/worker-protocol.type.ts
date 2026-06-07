import type { ArchFilter, FilterOptions } from "./data-source.type"
import type { Arch, ArchSummary } from "./architectures.type"

export type WorkerRequest =
  | { type: "init"; download: boolean }
  | { type: "getAllArchitectures"; filter?: ArchFilter }
  | { type: "getArchBySlug"; slug: string }
  | { type: "searchArchitectures"; query: string }
  | { type: "getFilterOptions" }

export type WorkerResponse =
  | { type: "ready"; msgId: number; message?: string }
  | { type: "error"; msgId: number; error: string }
  | { type: "getAllArchitectures"; msgId: number; data: ArchSummary[] }
  | { type: "getArchBySlug"; msgId: number; data: Arch | null }
  | { type: "searchArchitectures"; msgId: number; data: ArchSummary[] }
  | { type: "getFilterOptions"; msgId: number; data: FilterOptions }

export type WorkerInbound = WorkerRequest & { msgId: number }
