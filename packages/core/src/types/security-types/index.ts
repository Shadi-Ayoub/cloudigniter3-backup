import type { CiSettingsValue } from "@/types";

export type CiSecuritySettings = {
  enable2FA: boolean;
  [key: string]: CiSettingsValue;
};
