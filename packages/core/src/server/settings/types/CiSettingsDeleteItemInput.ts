import type { CiSettingsKey } from "./CiSettingsKey";

export type CiSettingsDeleteItemInput = {
  tableName: string;
  key: CiSettingsKey;
};
