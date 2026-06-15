// src/components/pages/privacy/privacy.content.ts

import type { PageContent } from "@/components/pages/content.types"

export const privacyContent: PageContent = {
  title: "Privacy Policy",
  lastUpdated: "June 15, 2026",
  contactEmail: "nolli.map@gmail.com",
  sections: [
    {
      heading: "In short",
      blocks: [
        {
          kind: "p",
          text: "Nolli collects very little. This page explains exactly what we collect, how sign-in works, where it lives, and your rights.",
        },
      ],
    },
    {
      heading: "What we collect",
      blocks: [
        {
          kind: "p",
          text: "When you sign in, Nolli receives your Google profile: your name, email address, and profile picture. That's it — we don't ask for anything else.",
        },
      ],
    },
    {
      heading: "How sign-in works",
      blocks: [
        {
          kind: "p",
          text: "Sign-in uses Google through Supabase. Google confirms who you are; we never see or store your password.",
        },
      ],
    },
    {
      heading: "Where your data lives",
      blocks: [
        {
          kind: "p",
          text: "Your account information is stored by Supabase. The map itself — architecture photos and the building database — is hosted on Cloudflare R2 as public catalog content, not personal data. The whole site runs on Cloudflare.",
        },
      ],
    },
    {
      heading: "What we don't do",
      blocks: [
        {
          kind: "list",
          items: [
            "No analytics or usage tracking.",
            "No advertising or tracking cookies.",
            "No selling or sharing your data. (Google and Supabase act only to provide sign-in and data storage.)",
          ],
        },
      ],
    },
    {
      heading: "Third-party services",
      blocks: [
        {
          kind: "p",
          text: "Three services touch your data: Google (sign-in), Supabase (account data), and Cloudflare (hosting). Each operates under its own privacy policy.",
        },
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        { kind: "p", text: "You can:" },
        {
          kind: "list",
          items: [
            "Sign out at any time.",
            "Ask to see the data we hold about you.",
            "Ask us to correct or delete it.",
          ],
        },
        {
          kind: "p",
          text: "To delete your account and associated data, email us — we'll action it within 30 days.",
        },
      ],
    },
    {
      heading: "How long we keep data",
      blocks: [
        {
          kind: "p",
          text: "We keep your account information until you ask us to delete it.",
        },
      ],
    },
    {
      heading: "Children",
      blocks: [
        {
          kind: "p",
          text: "Nolli isn't intended for anyone under 13. If you believe a minor has registered an account, contact us and we'll remove it.",
        },
      ],
    },
    {
      heading: "Changes to this policy",
      blocks: [
        {
          kind: "p",
          text: "We may update this policy as Nolli changes. The date above reflects the latest version.",
        },
      ],
    },
  ],
}
