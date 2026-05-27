import { type CiSettingsPageExtendedTab } from "@cloudigniter/core/types";
import { CiGeneralSettingsSection } from "./sections/CiGeneralSettingsSection";
import { CiSecuritySettingsSection } from "./sections/CiSecuritySettingsSection";
import { CiEmailSettingsSection } from "./sections/CiEmailSettingsSection";
import { CiI18nSettingsSection } from "./sections/CiI18nSettingsSection";
import { CiMainMenuSettingsSection } from "./sections/CiMainMenuSettingsSection";
import { CiThemeSettingsSection } from "./sections/CiThemeSettingsSection";

const fieldLabels: Record<string, string> = {
  appName: "Application Name",
  emailSender: "Sender Email",
  enable2FA: "Two-Factor Authentication",
  brandColor: "Brand Color",
  cognitoClientConfig: "Clent Configurations",
  footerText: "Footer Text",
};

const fieldSectionMap: Record<string, string> = {
  appName: "general",
  emailSender: "email",
  enable2FA: "security",
  brandColor: "branding",
  cognitoClientConfig: "cognito",
  footerText: "branding",
};

const baseTabs: CiSettingsPageExtendedTab[] = [
  {
    id: "general",
    label: "General",
    Component: CiGeneralSettingsSection,
  },
  {
    id: "security",
    label: "Security",
    Component: CiSecuritySettingsSection,
  },
  {
    id: "email",
    label: "Email",
    Component: CiEmailSettingsSection,
  },
  {
    id: "i18n",
    label: "Language",
    Component: CiI18nSettingsSection,
  },
  {
    id: "mainMenu",
    label: "Main Menu",
    Component: CiMainMenuSettingsSection,
  },
  {
    id: "theme",
    label: "System Theme",
    Component: CiThemeSettingsSection,
  },
];

export { baseTabs, fieldLabels, fieldSectionMap };
