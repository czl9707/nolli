// src/pages/about/about.content.ts

import type { PageContent } from "@/components/layout/content.types"

export const aboutContent: PageContent = {
  title: "About Nolli",
  lead: "The first map built for how architects actually think.",
  sections: [
    {
      heading: "Why this exists",
      blocks: [
        {
          kind: "p",
          text: "I studied architecture for seven years. Visited cities all over the world. Still walked past masterpieces without knowing they were there.",
        },
        {
          kind: "p",
          text: "ArchDaily shows you photos. Google Maps shows you pins. Neither tells you what's worth looking up at, right where you're standing.",
        },
        {
          kind: "p",
          text: "Architecture is the only art form where you have to already know where the good stuff is to find it. Museums curate. Spotify recommends. Nobody shows you the buildings worth seeing.",
        },
      ],
    },
    {
      heading: "Why it's called Nolli",
      blocks: [
        {
          kind: "p",
          text: "In 1748, Giambattista Nolli mapped Rome. He didn't draw streets — he drew solids and voids. Public space was light, private was dark. The map showed what walking the city felt like.",
        },
        {
          kind: "p",
          text: "Two hundred and seventy-eight years later, most maps still don't do this. This one does.",
        },
      ],
    },
    {
      heading: "Every building gets a board",
      blocks: [
        {
          kind: "p",
          text: "The best part of architecture school wasn't the lectures. It was the pin-up. Your project on the wall — plans, sections, photos, sketchy notes from midnight. Everything pinned together. That board told the whole story.",
        },
        {
          kind: "p",
          text: "So every building on this map has its own board.",
        },
      ],
    },
    {
      heading: "Who made this",
      blocks: [
        {
          kind: "p",
          text: "I'm Zane Chen. I studied architecture for seven years before I learned to code. This isn't a developer's take on architecture — it's an architect's take on what a map should be.",
        },
      ],
    },
    {
      heading: "What this is",
      blocks: [
        {
          kind: "p",
          text: "Two tools every architect already uses — the figure-ground map and the pin-up board — put together in one place. A map that treats masterpieces like masterpieces.",
        },
        {
          kind: "p",
          text: "It's early. The map grows a little every week.",
        },
      ],
    },
  ],
}
