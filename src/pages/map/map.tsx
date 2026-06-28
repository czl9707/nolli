// src/pages/map/map.tsx

import { Seo } from "@/components/layout/seo"
import { SideBar } from "@/pages/map/side-bar"
import { SideBarContent } from "@/pages/map/side-bar/sidebar-content"
import { PinBoard } from "@/pages/map/pin-board"

/** The map/home page: content panel + pin-board. Owns the default SEO. */
export function MapPage() {
  return (
    <>
      <Seo title="Nolli" description="A map built for architectures." path="/" />
      <SideBar>
        <SideBarContent />
      </SideBar>
      <PinBoard />
    </>
  )
}
