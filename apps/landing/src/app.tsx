import { useEffect, useState } from "react"
import { loadLandingData, type LandingData } from "@/lib/landing-data"
import { ThemeSync } from "@/components/theme-sync"
import {
  PrototypeSwitcher,
  type SectionKey,
} from "@/components/prototype-switcher"
import { HeroSurvey, HeroLeftGrade, HeroDim, HeroPlate, HeroFieldnote } from "@/sections/hero"
import { IndexScatter, IndexSplit, IndexDeck, IndexFramed, IndexLight } from "@/sections/index-section"
import { CloseupBoardRotating, CloseupBoard, CloseupDossier } from "@/sections/closeup"
import { CtaBookend, CtaAppHome, CtaPoster } from "@/sections/cta"
import {
  FooterMain,
  FooterColophon,
  FooterCredits,
  FooterDiagonal,
  FooterLetterbox,
  FooterGhost,
  FooterEndOfMap,
} from "@/sections/footer"

/**
 * PROTOTYPE — section-design playground. One section + variant per screen,
 * chosen by URL search params. No scroll, no wiring.
 */
const SECTIONS: Record<SectionKey, { key: string; name: string; el: (p: { data: LandingData }) => React.ReactNode }[]> = {
  hero: [
    { key: "D", name: "diagonal grade", el: HeroLeftGrade },
    { key: "A", name: "survey (bottom grade)", el: HeroSurvey },
    { key: "E", name: "uniform dim", el: HeroDim },
    { key: "B", name: "atlas plate", el: HeroPlate },
    { key: "C", name: "fieldnote", el: HeroFieldnote },
  ],
  index: [
    { key: "D", name: "framed map", el: IndexFramed },
    { key: "E", name: "light app mode", el: IndexLight },
    { key: "A", name: "scatter", el: IndexScatter },
    { key: "B", name: "split list", el: IndexSplit },
    { key: "C", name: "photo deck", el: IndexDeck },
  ],
  closeup: [
    { key: "A", name: "pin-board · rotating", el: CloseupBoardRotating },
    { key: "B", name: "dossier", el: CloseupDossier },
    { key: "C", name: "pin-board · static", el: CloseupBoard },
  ],
  cta: [
    { key: "A", name: "bookend (hero mirror)", el: CtaBookend },
    { key: "C", name: "app home", el: CtaAppHome },
    { key: "B", name: "poster", el: CtaPoster },
  ],
  footer: [
    { key: "G", name: "end of the map", el: FooterEndOfMap },
    { key: "D", name: "diagonal seam", el: FooterDiagonal },
    { key: "E", name: "letterbox strip", el: FooterLetterbox },
    { key: "F", name: "ghost void", el: FooterGhost },
    { key: "B", name: "colophon", el: FooterColophon },
    { key: "C", name: "roll credits", el: FooterCredits },
    { key: "A", name: "main", el: FooterMain },
  ],
}

const switcherSections: Record<SectionKey, { key: string; name: string }[]> = {
  hero: SECTIONS.hero.map(({ key, name }) => ({ key, name })),
  index: SECTIONS.index.map(({ key, name }) => ({ key, name })),
  closeup: SECTIONS.closeup.map(({ key, name }) => ({ key, name })),
  cta: SECTIONS.cta.map(({ key, name }) => ({ key, name })),
  footer: SECTIONS.footer.map(({ key, name }) => ({ key, name })),
}

function readParams(): { section: SectionKey; variant: string } {
  const params = new URLSearchParams(window.location.search)
  const section = (Object.keys(SECTIONS) as SectionKey[]).includes(params.get("section") as SectionKey)
    ? (params.get("section") as SectionKey)
    : "hero"
  const variant = SECTIONS[section].some((v) => v.key === params.get("variant"))
    ? params.get("variant")!
    : SECTIONS[section][0].key
  return { section, variant }
}

export function App() {
  const [data, setData] = useState<LandingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [{ section, variant }, setParams] = useState(readParams)

  useEffect(() => {
    loadLandingData().then(setData, (e) => setError(String(e)))
  }, [])

  useEffect(() => {
    const onPop = () => setParams(readParams())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const navigate = (section: SectionKey, variant: string) => {
    const url = `?section=${section}&variant=${variant}`
    window.history.pushState(null, "", url)
    setParams({ section, variant })
  }

  const current = SECTIONS[section].find((v) => v.key === variant) ?? SECTIONS[section][0]

  return (
    <>
      <ThemeSync />
      {error && <p style={{ padding: "2rem 6vw" }}>landing-data load failed: {error}</p>}
      {!error && (!data ? <p style={{ padding: "2rem 6vw" }}>loading…</p> : <current.el data={data} />)}
      <PrototypeSwitcher
        sections={switcherSections}
        section={section}
        variant={variant}
        onNavigate={navigate}
      />
    </>
  )
}
