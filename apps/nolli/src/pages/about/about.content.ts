// src/pages/about/about.content.ts

type Block = { title?: string; content: string[] }

export const aboutContent: { title: string; lead: string; blocks: Block[] } = {
  title: "About Nolli",
  lead: "A map built for architectures",
  blocks: [
    {
      title: "Why This Exists?",
      content: [
        "Both me and my wife were architects, but we still missed Gropius' masterpiece in Boston, even it was just 2 blocks away from us.",
        "ArchDaily shows you photos. Google Maps shows you pins. Neither tells you what's worth looking up at, right where you're standing.",
        "Architecture is the only art form where you have to already know where the good stuff is to find it. Museums curate. Spotify recommends. Nobody shows you the buildings worth seeing.",
      ]
    },
    {
      title: "What this is",
      content: [
        "A map that treats masterpieces like masterpieces. A map where only architectures live.",
        "It's early. The map grows a little every week."
      ]
    },
    {
      title: "The Man Behind Nolli",
      content: [
        "I'm Zane Chen. An ex-architect who code, and engineer who design.",
        "I build Nolli after my 9-5, and I do have quite some idea want to add to the app. So You definitely see a lot of \"coming soon\". You can email me to rush me. But trust me, they will be there.",
      ]
    },
    {
      title: "Why it's called Nolli",
      content: [
        "If you ask what kind of map is special for architect? I guess a big potion of architects will answer figure ground nolli map.",
        "In 1748, Giambattista Nolli mapped Rome. He drew solids and voids, public and private, light and dark. The map showed the kind of experience of walking int the city.",
      ]
    },
  ],
}
