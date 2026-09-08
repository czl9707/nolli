// City → architect morph: the spine interpolates the map shape; no
// overlay of its own.
import type { TransitionScene } from "@/spine/timeline"
import { Pane, Screen, VSplit } from "./grid"

export const cityArchitectTransition = (): TransitionScene => ({
  kind: "transition",
  id: "city-architect",
  fromShape: "[data-spine-shape='city']",
  toShape: "[data-spine-shape='architect']",
  heightVh: 60,
  Component: () => {
    return <Screen style={{ height: "60svh" }}>
      <VSplit>
        <Pane size="var(--grid-padding)" filled/>
        <Pane />
        <Pane size="var(--grid-padding)" filled/>
      </VSplit>
    </Screen>
  }
})
