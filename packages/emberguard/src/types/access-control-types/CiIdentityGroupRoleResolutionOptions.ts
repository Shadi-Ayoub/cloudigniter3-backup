/** Controls how identity-provider group names are translated into ARBAC roles. */
export type CiIdentityGroupRoleResolutionOptions = {
  /**
   * Exact, case-sensitive group-to-role aliases. A `null` value deliberately
   * excludes a provider group. Unmapped groups use their own name as role ID.
   */
  roleMap?: Readonly<Record<string, string | null>>;

  /** Behavior for a mapped role that does not exist in the access-control catalog. */
  unknownGroupStrategy?: "ignore" | "throw";
};
