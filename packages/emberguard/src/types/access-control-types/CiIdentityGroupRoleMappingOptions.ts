import type { CiGrantWindow } from "./CiGrantWindow";
import type { CiIdentityGroupRoleResolutionOptions } from "./CiIdentityGroupRoleResolutionOptions";

/** Adds assignment validity to identity-group role-resolution options. */
export type CiIdentityGroupRoleMappingOptions = CiIdentityGroupRoleResolutionOptions & {
  /** Optional validity window copied to generated role assignments. */
  window?: CiGrantWindow;
};
