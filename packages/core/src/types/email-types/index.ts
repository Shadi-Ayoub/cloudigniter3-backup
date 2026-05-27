import type { CiSettingsValue } from "@ci-core/types";

export type CiEmailSettings = {
  emailSender: string;
  [key: string]: CiSettingsValue;
};
