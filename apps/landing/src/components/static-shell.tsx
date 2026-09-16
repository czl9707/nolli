import { Body1, Body2, Caption, H1, H3, H4 } from "@nolli/ui"
import { SiteHeader } from "@/components/site-header"
import styles from "./static-shell.module.css"

export interface StaticBlock {
  title?: string
  content: string[]
}

export interface StaticPageContent {
  title: string
  lead?: string
  lastUpdated?: string
  blocks: StaticBlock[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function isListItem(line: string): boolean {
  return line.startsWith("- ")
}

/** One content string → a <p>, or a <ul> when it's a multi-line "- " list. */
function BlockBody({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "")
  if (lines.length > 1 && lines.every(isListItem)) {
    return (
      <Body1 asChild>
        <ul className={styles.list}>
          {lines.map((l, i) => (
            <li key={i}>{l.slice(2)}</li>
          ))}
        </ul>
      </Body1>
    )
  }
  return <Body1 className={styles.paragraph}>{text}</Body1>
}

export function StaticShell({ content }: { content: StaticPageContent }) {
  const toc = content.blocks
    .map((b, i) => ({ title: b.title, id: b.title ? slugify(b.title) || `s-${i}` : null }))
    .filter((e): e is { title: string; id: string } => e.id !== null)

  return (
    <main data-static className={styles.main}>
      <SiteHeader />
      <div className={styles.columns}>
        <nav className={styles.toc} aria-label="sections">
          {toc.map((e) => (
            <Body2 key={e.id} className={styles.tocItem} asChild>
              <a href={`#${e.id}`}>{e.title}</a>
            </Body2>
          ))}
        </nav>
        <div className={styles.content}>
          <H1>{content.title}</H1>
          {content.lead && (
            <H4 asChild>
              <p className={styles.lead}>{content.lead}</p>
            </H4>
          )}
          {content.lastUpdated && (
            <Caption className={styles.lastUpdated}>
              Last updated: {content.lastUpdated}
            </Caption>
          )}
          <div className={styles.body}>
            {content.blocks.map((block, i) => {
              const id = block.title ? slugify(block.title) || `s-${i}` : undefined
              return (
                <section key={i} id={id}>
                  {block.title && <H3>{block.title}</H3>}
                  {block.content.map((text, j) => (
                    <BlockBody key={j} text={text} />
                  ))}
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
