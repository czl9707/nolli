import { Body1, H3 } from "@nolli/ui";
import { SoftBlurIn } from "./SoftBlurIn";
import { WALK_SLOT_S, secToFrames } from "../lib/timeline";

// Tight reveal budgets for a building name (long names shouldn't spill the slot):
// ~0.13s/char window, 1-frame stagger.
const NAME_REVEAL_F = 6;
const NAME_STAGGER_F = 1;

export const Caption: React.FC<{ name: string; year: number; city: string; countryCode: string; intra: number }> = ({ name, year, city, countryCode, intra }) => {
  const slotFrame = Math.round(intra * secToFrames(WALK_SLOT_S));
  return (
    <div style={{ padding: "12px 4px", color: "rgb(var(--color-primary-foreground))" }}>
      <H3 style={{ margin: 0 }}>
        <SoftBlurIn text={name} frame={slotFrame} revealF={NAME_REVEAL_F} staggerF={NAME_STAGGER_F} />
      </H3>
      <Body1 style={{ color: "rgb(var(--color-secondary-foreground))", marginTop: 4 }}>
        <span style={{ color: "rgb(var(--color-accent-foreground))" }}>{year}</span> · {city}{countryCode ? `, ${countryCode}` : ""}
      </Body1>
    </div>
  );
};
