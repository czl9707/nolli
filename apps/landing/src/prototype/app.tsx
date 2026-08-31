// PROTOTYPE — landing redo variant host. Three structurally different takes
// on hero + index + header over the shared 6-col + margin grid. Switch with
// the bottom bar or ?variant=A|B|C.
import { VariantA } from "./variants/a"
import { VariantB } from "./variants/b"
import { VariantC } from "./variants/c"
import { PrototypeSwitcher, useVariantKey, type VariantDef } from "./switcher"

const VARIANTS: VariantDef[] = [VariantA, VariantB, VariantC]

export function PrototypeApp() {
  const { key, select } = useVariantKey(VARIANTS)
  const current = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0]
  const Component = current.Component
  // ?static=1 — fixed-height scenes for full-page captures (svh scales with
  // the viewport, so a tall capture window never shows scene 2)
  const staticScenes =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("static")
  return (
    <main>
      {staticScenes && <style>{"main > section { height: 900px !important; }"}</style>}
      <Component key={current.key} />
      <PrototypeSwitcher variants={VARIANTS} current={current} onSelect={select} />
    </main>
  )
}
