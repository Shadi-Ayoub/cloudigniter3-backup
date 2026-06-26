export type CiDevBeaconOptions = {
  /**
   * Enables the Dev Beacon feature.
   */
  enabled?: boolean;

  /**
   * Allows the Dev Beacon to be rendered in production.
   *
   * A user must still be authenticated and have the configured role.
   */
  allowProduction?: boolean;

  /**
   * Role required to access the Dev Beacon.
   *
   * Defaults to "DEVELOPER".
   */
  requiredRoles?: string[];
};
