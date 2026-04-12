import type { CiSettings } from "@cloudigniter/core";
import type { CiSettingsTableItem } from "./CiSettingsTableItem";

/**
 * Minimal DynamoDB adapter contract required by the settings store.
 *
 * This keeps the settings module aligned with CloudIgniter persistence helpers
 * without coupling the store to raw AWS SDK commands.
 */
export type CiSettingsDdbAdapter = {
  /**
   * Read one item by key.
   */
  getItem: <TSettings extends CiSettings = CiSettings>(input: {
    tableName: string;
    key: {
      PK: string;
      SK: string;
    };
  }) => Promise<CiSettingsTableItem<TSettings> | null>;

  /**
   * Upsert one settings item.
   */
  putItem: <TSettings extends CiSettings = CiSettings>(input: {
    tableName: string;
    item: CiSettingsTableItem<TSettings>;
  }) => Promise<void>;

  /**
   * Delete one item by key.
   */
  deleteItem: (input: {
    tableName: string;
    key: {
      PK: string;
      SK: string;
    };
  }) => Promise<boolean>;
};
