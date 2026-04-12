import type { CiSettings } from "@cloudigniter/core";
import type { CiSettingsTableItem } from "./CiSettingsTableItem";

export type CiSettingsPutItemInput<TSettings extends CiSettings = CiSettings> =
  {
    tableName: string;
    item: CiSettingsTableItem<TSettings>;
  };
