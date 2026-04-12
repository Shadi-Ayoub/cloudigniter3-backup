import type { CiSettingsKey } from "./CiSettingsKey";

export type CiSettingsGetItemInput = {
  tableName: string;
  key: CiSettingsKey;
};
