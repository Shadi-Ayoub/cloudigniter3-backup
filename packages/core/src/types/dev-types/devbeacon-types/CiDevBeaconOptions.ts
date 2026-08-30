export type CiDevBeaconOptions = {
  /**
   * Enables the Dev Beacon feature.
   */
  enabled?: boolean;

  /**
   * Retained for source compatibility. Developer tools now fail closed outside
   * `development`, so this value no longer enables production rendering.
   *
   * @deprecated Developer capabilities are development-only.
   */
  allowProduction?: boolean;

  /**
   * Exact role IDs allowed to access the Dev Beacon.
   *
   * Defaults to "developer".
   */
  requiredRoles?: string[];
};
