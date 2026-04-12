/**
 * Low-level key object used by the settings store.
 */
export type CiSettingsKeys = {
  /**
   * Partition key.
   */
  PK: string;

  /**
   * Sort key.
   */
  SK: string;
};
