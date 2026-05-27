import type { CiMainMenuItem } from "@cloudigniter/core/client";
import type {
  CiEmailSettings,
  CiGeneralSettings,
  CiI18nConfig,
  CiSecuritySettings,
  CiSettings,
  CiThemeConfig,
} from "@cloudigniter/core/types";

const settingsDefaultValues = {
  general: {
    applicationName: "Cloudigniter",
  } as CiGeneralSettings,
  security: {
    enable2FA: true,
  } as CiSecuritySettings,
  email: {
    emailSender: "admin@example.com",
  } as CiEmailSettings,
  i18n: {
    locales: [
      { code: "en", name: "english" },
      { code: "ar", name: "arabic" },
    ],
    defaultLocale: "en",
    cookieName: "ci-locale",
  } as CiI18nConfig,
  theme: {
    defaultTheme: "light",
    storageKey: "ci-theme",
    enableSystem: true,
    enableColorScheme: true,
    disableTransitionOnChange: false,
    themes: ["light", "dark"],
    attribute: "class", // fixed cannot be changed!
    forcedTheme: undefined,
    resolvedTheme: undefined,
    systemTheme: undefined,
    value: undefined,
    nonce: undefined,
    scriptProps: undefined,
    themeDir: "src/theme",
  } as CiThemeConfig,
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
      id: "cp",
      label: "Control Panel",
      url: "/cp",
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
  ] as CiMainMenuItem[],
} as CiSettings;

export { settingsDefaultValues };
