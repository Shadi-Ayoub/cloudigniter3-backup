/**
 * Resolved environment values required by the settings service.
 */
export type CiResolvedSettingsEnv = {
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
