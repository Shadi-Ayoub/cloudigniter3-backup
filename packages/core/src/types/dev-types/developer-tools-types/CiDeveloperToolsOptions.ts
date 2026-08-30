/** Shared access options for CloudIgniter development-only capabilities. */
export type CiDeveloperToolsOptions = {
  /** Enables the capability before environment and actor checks are applied. */
  enabled?: boolean;

  /**
   * At least one exact role ID required for access.
   *
   * Defaults to the canonical `developer` role. Role IDs are case-sensitive
   * and are never normalized because they are authorization identifiers.
   */
  requiredRoles?: readonly string[];
};
