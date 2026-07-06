import type { ArchSummary, Arch, BBox } from "./architectures.type"

export type ArchFilter = {
  bbox?: BBox
  architectIds?: readonly number[]
  cityIds?: readonly number[]
  query?: string
}

export type FilterOptions = {
  architects: readonly { id: number; name: string }[]
  cities: readonly { id: number; name: string; countryCode: string }[]
  countries: readonly { code: string; name: string }[]
}

export interface DataSource {
  getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]>
  getArchBySlug(slug: string): Promise<Arch | null>
  getArchSummariesByIds(ids: number[]): Promise<ArchSummary[]>
  getArchSummariesBySlugs(slugs: string[]): Promise<ArchSummary[]>
  getFilterOptions(): Promise<FilterOptions>
}
