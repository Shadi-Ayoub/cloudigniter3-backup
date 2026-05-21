import type { CiSettingsValue } from "@/types";

export type CiEmailSettings = {
  emailSender: string;
  [key: string]: CiSettingsValue;
};
