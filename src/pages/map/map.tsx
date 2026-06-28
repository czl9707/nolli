// src/pages/map/map.tsx

import { Seo } from "@/components/layout/seo"
import { ContentPanel } from "@/components/sidebar/content-panel"
import { PanelContent } from "@/components/sidebar/panel-content"
import { PinBoard } from "@/components/pin-board"

/** The map/home page: content panel + pin-board. Owns the default SEO. */
export function MapPage() {
  return (
    <>
      <Seo title="Nolli" description="A map built for architectures." path="/" />
      <ContentPanel>
        <PanelContent />
      </ContentPanel>
      <PinBoard />
    </>
  )
}
