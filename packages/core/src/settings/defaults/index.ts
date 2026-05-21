import type { CiSettings } from "@/types";

export const ciDefaultPublicCoreSettings: CiSettings = {
  general: {
    applicationName: "CloudIgniter",
  },
  i18n: {
    locales: [
      { code: "en", name: "English" },
      { code: "ar", name: "Arabic" },
    ],
    defaultLocale: "en",
    cookieName: "ci-locale",
  },
  theme: {
    defaultTheme: "light",
    storageKey: "ci-theme-mode",
    enableSystem: true,
    enableColorScheme: true,
    disableTransitionOnChange: false,
    themes: ["light", "dark"],
    attribute: "class",
  },
};

export const ciDefaultPrivateCoreSettings: CiSettings = {
  security: {
    enable2FA: false,
  },
  email: {
    emailSender: "admin@example.com",
  },
  mainMenu: [],
};

export const ciDefaultUserCoreSettings: CiSettings = {
  //   locale: {
  //     preferredLocale: undefined,
  //   },
  //   theme: {
  //     preferredTheme: undefined,
  //   },
};

export const ciCoreSettingsDefaults = {
  public: ciDefaultPublicCoreSettings,
  private: ciDefaultPrivateCoreSettings,
  user: ciDefaultUserCoreSettings,
};
