// src/components/layout/content-sections.tsx

import { Body1, Body2, H2 } from "@/components/ui/typography"
import type { ContentSection } from "./content.types"
import styles from "./content-sections.module.css"

export function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <div className={styles.sections}>
      {sections.map((section, i) => (
        <section key={i} className={styles.section}>
          {section.heading && (
            <H2 className={styles.heading}>{section.heading}</H2>
          )}
          {section.blocks.map((block, j) => {
            if (block.kind === "p") {
              return (
                <Body1 key={j} className={styles.paragraph}>
                  {block.text}
                </Body1>
              )
            }
            return (
              <ul key={j} className={styles.list}>
                {block.items.map((item, k) => (
                  <li key={k}>
                    <Body2 asChild>
                      <span>{item}</span>
                    </Body2>
                  </li>
                ))}
              </ul>
            )
          })}
        </section>
      ))}
    </div>
  )
}
