import type { CiScopedSettingsScope } from "../../common/types/CiScopedSettingsScope";
import type { CiSettingsDdbAdapter } from "./CiSettingsDdbAdapter";

/**
 * Input used to create a DynamoDB-backed settings store.
 */
export type CiCreateDynamoSettingsStoreInput = {
  /**
   * CloudIgniter DynamoDB adapter.
   */
  adapter: CiSettingsDdbAdapter;

  /**
   * Public settings table name.
   */
  publicSettingsTableName: string;

  /**
   * Private settings table name.
   */
  privateSettingsTableName: string;

  /**
   * User settings table name.
   */
  userSettingsTableName: string;
};

/**
 * Table name resolution input.
 */
export type CiResolveSettingsTableNameInput = {
  /**
   * Persistence-supported scope.
   */
  scope: CiScopedSettingsScope;
} & Pick<
  CiCreateDynamoSettingsStoreInput,
  | "publicSettingsTableName"
  | "privateSettingsTableName"
  | "userSettingsTableName"
>;
