import type { CiSettingsValue } from "@/types";

export type CiGeneralSettings = {
  applicationName: string;
  [key: string]: CiSettingsValue;
};
