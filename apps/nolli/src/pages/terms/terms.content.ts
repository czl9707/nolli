// src/pages/terms/terms.content.ts

type Block = { title?: string; content: string[] }

export const termsContent: {
  title: string
  lastUpdated: string
  blocks: Block[]
} = {
  title: "Terms of Service",
  lastUpdated: "June 15, 2026",
  blocks: [
    {
      content: [
        "Welcome to Nolli! By accessing or using our website, you agree to comply with and be bound by these Terms of Service.",
      ]
    },
    {
      title: "Account Creation",
      content: [
        "To use certain features, you must log in via a valid Google account. You are responsible for maintaining the security of your login session and for any activity that occurs under your account.",
      ],
    },
    {
      title: "Acceptable Use",
      content: [
        "You agree to use Nolli responsibly. You must not:",
        `- Use the service for any illegal or unauthorized purpose.
- Attempt to disrupt, hack, or reverse-engineer our systems or infrastructure.
- Abuse or spam the application or other users.`,
      ],
    },
    {
      title: "Intellectual Property",
      content: [
        "All code, design, branding, and original content on Nolli are the intellectual property of Zane Chen. You may not copy or reuse any portion of our frontend or backend code without explicit permission.",
      ],
    },
    {
      title: `Service Availability & Liability ("As-Is")`,
      content: [
        `We provide this service on an "as-is" and "as-available" basis. While we do our best to maintain a smooth experience, we cannot guarantee 100% uptime. We are not liable for any data loss, bugs, or interruptions that may occur.`,
      ],
    },
    {
      title: "Termination",
      content: [
        "We reserve the right to suspend or terminate your access to the service at our sole discretion, without notice, if we believe you have violated these terms.",
      ],
    },
    {
      title: "Updates to These Terms",
      content: [
        "We may occasionally update these terms. Continued use of the app after an update implies acceptance of the new terms.",
      ],
    },
    {
      title: "Contact",
      content: [
        "Questions about these terms? Reach out to us at nolli.map@gmail.com.",
      ],
    },
  ],
}
