import type { LandingData } from "@/lib/landing-data"

/** Index overlay (prototype E "light app mode"): light page around the card
 * slot, statement above. The stage's map layer settles into the frame — no
 * backing element here, only the frame itself. */
export function IndexScene({ data }: { data: LandingData }) {
  void data
  return (
    <section className="index-scene">
      <div className="index-scene__frame" />
      <div className="index-scene__copy">
        <p className="hand index-scene__overline">The Index</p>
        <h2 className="index-scene__statement">
          Google Maps has all the pins.
          <br />
          ArchDaily has all the information.
          <br />
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </section>
  )
}
