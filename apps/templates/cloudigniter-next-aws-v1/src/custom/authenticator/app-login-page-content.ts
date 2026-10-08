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

  signUp: {
    eyebrow?: string;
    title: string;
    description?: string;
    steps: Array<{
      title: string;
      description?: string;
    }>;
  };

  accountNavigation: {
    signInHref: string;
    signUpHref: string;
    signInPrompt: string;
    signInLabel: string;
    signUpPrompt: string;
    signUpLabel: string;
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

  signUp: {
    eyebrow: "Create account",
    title: "Set up your account.",
    description:
      "Complete your account details below. Optional profile information can be updated later.",
    steps: [
      {
        title: "Enter your details",
        description: "Provide your account and profile information.",
      },
      {
        title: "Verify your account",
        description: "Confirm your identity using the verification code.",
      },
      {
        title: "Access the application",
        description: "Continue securely to your workspace.",
      },
    ],
  },

  accountNavigation: {
    signInHref: "/login",
    signUpHref: "/create-account",
    signInPrompt: "Already have an account?",
    signInLabel: "Sign in",
    signUpPrompt: "Don't have an account?",
    signUpLabel: "Create account",
  },

  support: {
    text: "Need help accessing your account?",
    linkLabel: "Contact support",
    href: "/support",
  },
};
