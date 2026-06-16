// src/pages/privacy/privacy.content.ts

type Block = { title?: string; content: string[] }

export const privacyContent: {
  title: string
  lastUpdated: string
  blocks: Block[]
} = {
  title: "Privacy Policy",
  lastUpdated: "June 15, 2026",
  blocks: [
    {
      title: "Information We Collect",
      content: [
        "We only collect the minimum amount of information necessary to provide our service. When you log in using your Google account, we collect:",
        `- Your Email Address: To identify your account and send you essential system notifications.
- Your Name/Username: To personalize your experience inside the app.
- Your Profile Picture (Avatar): To display within your account dashboard.`,
        "We do not collect or track any other personal data, location data, or browsing history.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "We use your information strictly for:",
        `- Creating and maintaining your user account.
- Authenticating your login sessions.
- Providing user support if you reach out to us.`,
        "We will never sell, rent, or share your personal data with third-party advertisers or marketers.",
      ],
    },
    {
      title: "Data Storage and Security",
      content: [
        "Your data is stored securely using industry-standard cloud database providers. We implement modern security practices to protect your information from unauthorized access.",
      ],
    },
    {
      title: "Third-Party Services",
      content: [
        "We use Google OAuth for authentication. Your interaction with Google is governed by Google's own Privacy Policy. We only receive the specific profile data mentioned above.",
      ],
    },
    {
      title: "Your Rights and Data Deletion",
      content: [
        "You own your data. If you would like to delete your account and completely wipe your data from our database, you can do so at any time by emailing us at nolli.map@gmail.com.",
      ],
    },
    {
      title: "Contact Us",
      content: [
        "If you have any questions about this Privacy Policy, please contact us at nolli.map@gmail.com.",
      ],
    },
  ],
}
