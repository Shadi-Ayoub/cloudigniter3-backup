import type { CiCoreSettings } from "@cloudigniter/core/types";

export async function appGetSettings() {
  return settings;
}

const settings: CiCoreSettings & Record<string, unknown> = {
  public: {
    general: { applicationName: "Cloudigniter" },
    i18n: {
      locales: [
        { code: "en", name: "english" },
        { code: "ar", name: "arabic" },
      ],
      defaultLocale: "en",
      cookieName: "ci-locale",
    },
    theme: {
      defaultTheme: "light",
      storageKey: "ci-theme",
      enableSystem: true,
      enableColorScheme: true,
      disableTransitionOnChange: false,
      supportedThemes: ["light", "dark"],
      attributeStrategy: "class",
    },
  },
  private: {
    security: { enable2FA: true },
    email: { emailSender: "admin@example.com" },
    mainMenu: [
      {
        id: "home",
        label: "Home",
        url: "/",
        icon: "House",
        hidden: false,
        target: "_self",
      },
      {
        id: "dashboard",
        label: "Dashboard",
        url: "/dashboard",
        icon: "LayoutDashboard",
        hidden: false,
        target: "_self",
        subMenu: {
          Development: {
            id: "develope",
            label: "Develope",
            icon: "Code",
            hidden: false,
            target: "_self",
            subMenu: {
              Sandbox: {
                id: "sandbox",
                label: "Sandbox",
                url: "/cp/dev/sandbox",
                icon: "Codesandbox",
                hidden: false,
                target: "_self",
              },
              Manual: {
                id: "manual",
                label: "Manual",
                url: "/cp/dev/manual",
                icon: "BookOpenText",
                hidden: false,
                target: "_self",
              },
            },
          },
        },
      },
    ],
  },
  user: {
    locale: "en",
    theme: "standard",
    colorScheme: "light",
  },
};
