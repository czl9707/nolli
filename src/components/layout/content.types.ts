// src/components/layout/content.types.ts

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }

export interface ContentSection {
  heading?: string
  blocks: ContentBlock[]
}

export interface PageContent {
  title: string
  lead?: string
  lastUpdated?: string
  sections: ContentSection[]
  contactEmail?: string
}
