export interface AppLoginPageContent {
  brand: {
    name: string;
    logoSrc?: string;
    logoAlt: string;
  };

  hero: {
    enabled: boolean;
    eyebrow?: string;
    title: string;
    description?: string;
    highlights?: string[];
  };

  support?: {
    text: string;
    linkLabel: string;
    href: string;
  };
}

/**
 * Application-owned starter content.
 *
 * Developers should replace these values when evolving the template into
 * their own application.
 */
export const appLoginPageContent: AppLoginPageContent = {
  brand: {
    name: "CloudIgniter",
    logoSrc: "/images/cloudigniter-icon-1.png",
    logoAlt: "Application logo",
  },

  hero: {
    enabled: true,
    eyebrow: "Welcome",
    title: "Sign in to continue.",
    description:
      "Access your workspace securely and continue where you left off.",
    highlights: [
      "Secure account access",
      "Your services in one place",
      "Built for your organisation",
    ],
  },

  support: {
    text: "Need help accessing your account?",
    linkLabel: "Contact support",
    href: "/support",
  },
};
